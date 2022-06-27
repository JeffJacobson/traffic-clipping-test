/**
 * This module provides information about the ArcGIS
 * Traffic service.
 * @module
 */

/** Valid region names */
export type RegionName =
  | 'North America'
  | 'South America'
  | 'Europe'
  | 'Middle East and Africa'
  | 'Asia Pacific'
  | 'India'
  | 'South East Asia';
/** Valid layer names */
export type LayerName =
  | 'Traffic Incidents Overview'
  | 'Traffic Incidents Intermediate'
  | 'Traffic Incidents Detailed'
  | 'Live Traffic'
  | 'Traffic';

/**
 * Information about a layer of the ArcGIS Traffic map service.
 * @see {@link https://developers.arcgis.com/rest/network/api-reference/traffic-service.htm}
 */
export class TrafficLayerInfo {
  constructor(public regionName: RegionName, public layerName: LayerName, public layerId: number) {}
}

/**
 * An extension of the Array class with additional methods.
 */
export class TrafficLayerInfoArray extends Array<TrafficLayerInfo> {
  constructor(...items: Array<[RegionName, LayerName, number]>) {
    console.log("items", items);
    const convertedItems = items.map((record) => {
        console.debug(record);
        return new TrafficLayerInfo(...record);
    });
    super(...convertedItems);
  }
  /**
   * Returns all of the layers for a region
   * @param region The name of a region.
   */
  public getLayerInfosForRegion(region: RegionName) {
    this.filter((info) => info.regionName === region);
  }

  /**
   * Gets all of the layer IDs excluding the given one.
   * @param ids IDs of layers to exclude to exclude
   * @returns 
   */
  public getAllIdsExceptGiven(...ids: number[]): TrafficLayerInfo[] {
    return this.filter((item) => item.layerId in ids);
  }
}

const layerInfos = new TrafficLayerInfoArray(
  // ["Region Name", "Layer Name", "Layer ID"],
  ['North America', 'Traffic Incidents Overview', 2],
  ['North America', 'Traffic Incidents Intermediate', 3],
  ['North America', 'Traffic Incidents Detailed', 4],
  ['North America', 'Live Traffic', 6],
  ['North America', 'Traffic', 7],
  ['South America', 'Traffic Incidents Overview', 10],
  ['South America', 'Traffic Incidents Intermediate', 11],
  ['South America', 'Traffic Incidents Detailed', 12],
  ['South America', 'Live Traffic', 14],
  ['South America', 'Traffic', 15],
  ['Europe', 'Traffic Incidents Overview', 18],
  ['Europe', 'Traffic Incidents Intermediate', 19],
  ['Europe', 'Traffic Incidents Detailed', 20],
  ['Europe', 'Live Traffic', 22],
  ['Europe', 'Traffic', 23],
  ['Middle East and Africa', 'Traffic Incidents Overview', 26],
  ['Middle East and Africa', 'Traffic Incidents Intermediate', 27],
  ['Middle East and Africa', 'Traffic Incidents Detailed', 28],
  ['Middle East and Africa', 'Live Traffic', 30],
  ['Middle East and Africa', 'Traffic', 31],
  ['Asia Pacific', 'Traffic Incidents Overview', 46],
  ['Asia Pacific', 'Traffic Incidents Intermediate', 47],
  ['Asia Pacific', 'Traffic Incidents Detailed', 48],
  ['Asia Pacific', 'Live Traffic', 42],
  ['Asia Pacific', 'Traffic', 43],
  ['India', 'Live Traffic', 34],
  ['India', 'Traffic', 35],
  ['South East Asia', 'Live Traffic', 38],
  ['South East Asia', 'Traffic', 39],
);

export default layerInfos;
