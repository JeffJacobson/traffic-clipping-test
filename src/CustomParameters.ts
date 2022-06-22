import Extent from "@arcgis/core/geometry/Extent";
import Polygon from "@arcgis/core/geometry/Polygon";

export interface Clipping {
    geometryType: 'esriGeometryPolygon' | 'esriGeometryEnvelope';
    geometry: __esri.PolygonProperties | __esri.Envelope;
    excludedLayers?: number[];
}

export type CustomParameters = {
    [key: string]: any;
    clipping?: Clipping;
};

type ClippingGeometry = Polygon | Extent

export function createClippingCustomParams(geometry: ClippingGeometry | null, excludedLayers?: number[]): CustomParameters | null {
    if (!geometry) {
        return null;
    }
    return {
        clipping: {
            geometryType: geometry instanceof Polygon ? "esriGeometryPolygon" : "esriGeometryEnvelope",
            geometry: geometry.toJSON(),
            excludedLayers: excludedLayers
        }
    }
}

export default CustomParameters;
