import Polyline from '@arcgis/core/geometry/Polyline';
import Polygon from '@arcgis/core/geometry/Polygon';
import { buffer, simplify, difference } from '@arcgis/core/geometry/geometryEngineAsync';
import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import { waExtentWebMercator } from './WAExtent';
import ZoomLevelBufferMap from './ZoomLevelBufferMap';

const closureUrl = 'https://data.wsdot.wa.gov/travelcenter/Dev/CurrentRoadClosureLine.json';

export async function getFeatureSet(url: string = closureUrl) {
  const result = await fetch(url);
  const parsedJson = await result.json() as __esri.FeatureSetProperties;
  const featureSet = FeatureSet.fromJSON(parsedJson);
  return featureSet;
}

async function getClippingMask(bufferSize: number, closureLineGeometries: Polyline[]) {
  let bufferPolygon = await buffer(closureLineGeometries, bufferSize, 'feet', true);
  bufferPolygon = Array.isArray(bufferPolygon) ? bufferPolygon[0] : bufferPolygon;
  bufferPolygon = (await simplify(bufferPolygon)) as Polygon;
  const output = await difference(waExtentWebMercator, bufferPolygon);
  return output as Polygon;
}

const lastClosureDateSessionStorageKey = 'lastClosureDate';
/**
 * Gets a mapping of closure polygons keyed by zoom level IDs.
 * @param url Closure FeatureSet JSON
 * @returns A mapping of closure polygons keyed by zoom level IDs.
 */
export async function getClosures(url = closureUrl) {
  const featureSet = await getFeatureSet(url);

  // ArcGIS stores date values as integers. Since we're just comparing them
  // they will be left that way instead of converting them to Date objects.
  const previousLastClosureDateFromStorage = sessionStorage.getItem(lastClosureDateSessionStorageKey);
  // Convert the value from session storage into a number, or set to zero if a value hasn't been defined yet.
  const previousLastClosureDate = previousLastClosureDateFromStorage
    ? parseInt(previousLastClosureDateFromStorage)
    : 0;

  let lastClosureDate = 0;

  if (featureSet.features == null) {
    const errorMessage = `Feature set's "features" property is undefined.`;
    throw new Error(errorMessage);
  }

  const closureLines = featureSet.features
    .filter((f) => f.geometry?.type === 'polyline')
    .map((f) => {
      const currentDate = f.attributes.LastModifiedDate;
      if (!lastClosureDate && currentDate > lastClosureDate) {
        lastClosureDate = currentDate;
      }
      const polyline = f.geometry as Polyline;
      return polyline;
    });

  if (lastClosureDate > previousLastClosureDate) {
    sessionStorage.setItem(lastClosureDateSessionStorageKey, lastClosureDate.toString(10));
  }

  const clippingMaskPromises = ZoomLevelBufferMap.map(async ({ bufferSize, zoomLevel }) => {
    const clippingMask = await getClippingMask(bufferSize, closureLines);
    return [zoomLevel, clippingMask] as [number, Polygon];
  });

  return new Map(await Promise.all(clippingMaskPromises));

}
