interface Query {
    [key: string]: string | number | boolean | null | undefined,
    clipping?: string
}

interface RequestOptions {
    responseType: "image" | string,
    "signal": { [key: string]: unknown },
    "query": Query
}

interface InterceptBefore {
    "url": "https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer/export",
    "requestOptions": RequestOptions
}

export type { RequestOptions, InterceptBefore }