
import Geometry from "@arcgis/core/geometry/Geometry";
import Polygon from "@arcgis/core/geometry/Polygon";
import Extent from "@arcgis/core/geometry/Extent";

type validClippingGeometryType = 'esriGeometryPolygon' | 'esriGeometryEnvelope';
type esriGeometryType = validClippingGeometryType | 'esriGeometryPoint' | 'esriGeometryMultipoint' | 'esriGeometryPolyline';
type geometryObjectTypeName = "point" | "multipoint" | "polyline" | "polygon" | "extent" | "mesh";

type PlainGeometryObject = __esri.PolygonProperties | __esri.ExtentProperties;

const typeNameMapping = new Map<geometryObjectTypeName, esriGeometryType>(
    [
        ["point", "esriGeometryPoint"],
        ["multipoint", "esriGeometryMultipoint"],
        ["point", "esriGeometryPoint"],
        ["extent", "esriGeometryEnvelope"],
        ["polygon", "esriGeometryPolygon"],
        ["polyline", "esriGeometryPolyline"]
    ]
);

export interface Clipping {
    geometryType: validClippingGeometryType;
    geometry: PlainGeometryObject;
    excludedLayers?: number[];
}

function objectHasAllProperties(o: object, ...properties: string[]) {
    for (const propertyName of properties) {
        if (!o.hasOwnProperty(propertyName)) {
            return false;
        }
    }
    return true;
}

function getEsriGeometryType(geometry: PlainGeometryObject | Geometry): esriGeometryType {
    function createMessage(geometryObject: Geometry): string | undefined {
        return `Unsupported geometry type: ${geometryObject.type}`;
    }
    if (geometry instanceof Geometry) {
        if (geometry.type === "mesh") {
            throw new TypeError(createMessage(geometry));
        }
        const output = typeNameMapping.get(geometry.type);
        if (!output) {
            throw new TypeError(createMessage(geometry));
        }
        return output;
    } else if (objectHasAllProperties(geometry, "rings")) {
        return "esriGeometryPolygon";
    }
    if (objectHasAllProperties(geometry, "xmin", "xmax", "ymin", "ymax")) {
        return "esriGeometryEnvelope";
    }
    throw TypeError("Unsupported geometry type");



}

type ClippingGeometry = Polygon | Extent

export function createClippingCustomParams(geometry: ClippingGeometry | null, excludedLayers?: number[]): Clipping | null {
    let clipping: Clipping | null = null;
    if (geometry) {
        const geometryType = getEsriGeometryType(geometry);
        clipping = {
            geometryType: geometryType as validClippingGeometryType,
            geometry: geometry.toJSON(),
        };
        if (excludedLayers) {
            clipping.excludedLayers = excludedLayers;
        }
    }
    return clipping;
}