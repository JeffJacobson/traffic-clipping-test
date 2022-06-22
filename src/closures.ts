import Polyline from "@arcgis/core/geometry/Polyline";
import Polygon from "@arcgis/core/geometry/Polygon";
import Geometry from "@arcgis/core/geometry/Geometry";
import { buffer, simplify, difference } from "@arcgis/core/geometry/geometryEngineAsync";
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import WAExtent from "./WAExtent";
import ZoomLevelBufferMap from "./ZoomLevelBufferMap"

const closureUrl = "https://data.wsdot.wa.gov/travelcenter/Dev/CurrentRoadClosureLine.json"


async function getClippingMask(bufferSize: number, closureLineGeometries: Polyline[]) {
    console.group("getClippingMask");
    try {

        let bufferPolygon = await buffer(closureLineGeometries, bufferSize, "feet", true) as Geometry;
        bufferPolygon = await simplify(bufferPolygon);
        const output = await difference(WAExtent, bufferPolygon)

        return output as Polygon;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        console.groupEnd();
    }
}

/**
 * Gets a mapping of closure polygons keyed by zoom level IDs.
 * @param url Closure FeatureSet JSON
 * @returns A mapping of closure polygons keyed by zoom level IDs.
 */
export async function getClosures(url = closureUrl) {
    console.group("getClosures");
    try {
        const result = await fetch(url);
        const featureSetJson = await result.json() as __esri.FeatureSetProperties;
        const featureSet = new FeatureSet(featureSetJson);

        const closureLines = featureSet.features.filter(f => f.geometry.type === "polyline").map(f => {
            const polyline = f.geometry as Polyline;
            return polyline;
        });

        const clippingMaskPromises = ZoomLevelBufferMap.map(async ({ bufferSize, zoomLevel }) => {
            const clippingMask = await getClippingMask(bufferSize, closureLines);
            return [zoomLevel, clippingMask] as [number, Geometry];
        })

        return new Map(await Promise.all(clippingMaskPromises));
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        console.groupEnd();
    }
}