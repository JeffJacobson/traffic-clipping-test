/**
 * This module provides additional type information
 * where the ArcGIS API does not. (E.g., it uses an
 * "any" instead of something more specific.)
 * @module
 */

interface Query {
    [key: string]: string | number | boolean | null | undefined,
    clipping?: string
}

/**
 * The options from an intercepted ArcGIS service request.
 */
interface RequestOptions {
    responseType: "image" | string,
    "signal": { [key: string]: unknown },
    "query": Query
}

/**
 * This interface is for the parameter of the handler
 * for the intercept function, providing additional 
 * type information.
 */
interface InterceptBefore {
    "url": "https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer/export",
    "requestOptions": RequestOptions
}

export type { RequestOptions, InterceptBefore }