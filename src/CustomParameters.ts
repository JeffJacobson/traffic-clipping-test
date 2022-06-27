
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

/**
 * Represents map service export "clipping" parameter.
 */
export interface Clipping {
    geometryType: validClippingGeometryType;
    geometry: PlainGeometryObject;
    excludedLayers?: number[];
}

/**
 * Checks an object to see if it has all of the given named properties.
 * @param o An object
 * @param properties Property names
 * @returns Returns true if the object has ALL of the named properties, false otherwise.
 */
function objectHasAllProperties(o: object, ...properties: string[]) {
    for (const propertyName of properties) {
        if (!o.hasOwnProperty(propertyName)) {
            return false;
        }
    }
    return true;
}

/**
 * Gets the "esriGeometry____" geometry type name from a geometry object
 * by examining its properties.
 * @param geometry A geometry object
 * @returns Returns the corresponding type name
 */
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


/**
 * Creates a clipping parameter from the input geometry.
 * @param geometry 
 * @param excludedLayers 
 * @returns 
 */
export function createClippingParameter(geometry: ClippingGeometry | null, excludedLayers?: number[]): Clipping | null {
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