import Polyline from '@arcgis/core/geometry/Polyline';
import Polygon from '@arcgis/core/geometry/Polygon';
import { geodesicBuffer, simplify, union } from '@arcgis/core/geometry/geometryEngineAsync';
import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import ZoomLevelBufferMap from './ZoomLevelBufferMap';
import { waExtentWebMercator } from './WAExtent';

const closureUrl = 'https://data.wsdot.wa.gov/travelcenter/Dev/CurrentRoadClosureLine.json';

interface HasTimestamp {
  timestamp: Date;
}

interface ClosuresFeatureSet extends FeatureSet, HasTimestamp {
  
}



/**
 * Custom JSON parsing
 * @param this JSON object being parsed
 * @param key Name of the current property
 * @param value Value of the current property.
 * @returns Returns the value. "timestamp" property will be parsed into a Date.
 */
function reviveJson(this: any, key: string, value: any): any {
  if (key === "timestamp" && typeof value === "string") {
    try {
      const date = new Date(value);
      return date;
    } catch (err) {
      console.error(`Error parsing timestamp "${value}"`);
    }
  }
  return value;
}

export async function getFeatureSet(url: string = closureUrl) {
  const result = await fetch(url);
  const jsonText = await result.text();
  const parsedJson = JSON.parse(jsonText, reviveJson) as __esri.FeatureSetProperties & HasTimestamp;
  const featureSet = FeatureSet.fromJSON(parsedJson) as ClosuresFeatureSet;
  if (!featureSet.timestamp) {
    featureSet.timestamp = parsedJson.timestamp;
  }
  return featureSet;
}

/**
 * Enumerates through a feature set
 * @param featureSet A feature set
 * @yields An object with a { polyline: Polyline, latestDate: number (an integer) }
 */
function* enumerateFeatures(featureSet: FeatureSet) {
  // console.groupCollapsed("enumerating features");
  let latestDate = 0;
  for (const feature of featureSet.features) {
    const polyline = feature.geometry as Polyline;
    const date = feature.attributes.LastModifiedDate;
    // Update the latest date if current is newer
    if (date > latestDate) {
      latestDate = date;
    }
    yield { polyline, latestDate };
  }
  // console.groupEnd();
}

// function* testRings(polygon: Polygon) {
//   const clockwiseRings = new Array<number>();
//   const counterClockwiseRings = new Array<number>();
//   for (const [index, ring] of polygon.rings.entries()) {
//     const isClockwise = polygon.isClockwise(ring);
//     if (isClockwise) {
//       clockwiseRings.push(index);
//     } else {
//       counterClockwiseRings.push(index);
//     }
//     yield {
//       index, 
//       isClockwise, 
//       isSelfIntersecting: polygon.isSelfIntersecting
//     };
//   }
//   return {clockwiseRings, counterClockwiseRings};
// }

async function getClippingMask(bufferSize: number, closureLineGeometries: Polyline[]) {
  // console.group("getClippingMask");
  let bufferPolygon: Polygon | Polygon[] = await geodesicBuffer(closureLineGeometries, bufferSize, 'feet', true);
  // console.debug("buffered polygon", Array.isArray(bufferPolygon) ? bufferPolygon.map(p => p.toJSON()) : bufferPolygon.toJSON());
  let unionedGeometry: Polygon;
  // Convert geometry array to single geometry.
  if (Array.isArray(bufferPolygon)) {
    // If the array only has a single element, just use that one.
    // Otherwise, union the geometry.
    unionedGeometry = (bufferPolygon.length === 1 ? bufferPolygon[0] : await union(bufferPolygon)) as Polygon;
    // console.debug("buffer operation returned an array. Union result", unionedGeometry.toJSON());
  } else {
    // Already is a single geometry; just assign as is.
    unionedGeometry = bufferPolygon;
    // console.debug("buffer geometry was not an array");
  }
  // Simplify the geometry.
  const simplifiedGeometry = await simplify(unionedGeometry) as Polygon;
  // console.debug("simplified geometry", simplifiedGeometry);

  const output = Polygon.fromExtent(waExtentWebMercator);
  // console.debug("converted WA extent to polygon", { waExtentWebMercator, "as Polygon": output })
  // output.rings?.push(...simplifiedGeometry.rings);
  simplifiedGeometry.rings.forEach(r => output.addRing(r));
  // console.debug("added rings to output", output.toJSON());
  // const containingRings =
  //   [[
  //     [-13931998.871850241, 6307186.773851644],
  //     [-12987205.690744698, 6307186.773851644],
  //     [-12987205.690744698, 5700000.603400948],
  //     [-13931998.871850241, 5700000.603400948],
  //     [-13931998.871850241, 6307186.773851644]
  //   ]];
  // output.rings = containingRings.concat(simplifiedGeometry.rings)

  // console.group("testing rings");
  // for (const result of testRings(output)) {
  //   console.debug(`ring ${result.index}`, result)
  // }
  // console.groupEnd();
  // console.groupEnd();
  return output;
}

// const lastClosureDateSessionStorageKey = 'lastClosureDate';
const closuresTimeStampKey = "closuresTimeStamp";

function getLastClosureTimeStamp() {
  let lastClosuresTimeStamp = sessionStorage.getItem(closuresTimeStampKey);
  if (lastClosuresTimeStamp === null) {
    return new Date(0);
  }

  return new Date(lastClosuresTimeStamp);
}

function setLastClosureTimeStamp(date: Date) {
  sessionStorage.setItem(closuresTimeStampKey, date.toISOString());
}

window.addEventListener("close", () => {
  sessionStorage.clear();
}, {
  passive: true
}); 

export interface GetClosuresOutput {
  /** 
   * Indicates if the closure features have changed since last refresh.
   * If they have not, then the mapping and closureFeatureSet properties
   * will be undefined.
   */
  hasChanged: boolean,
  /**  A mapping of closure polygons keyed by zoom level IDs. */
  mapping?: Map<number, Polygon>,
  /** Closure feature set parsed from JSON */
  closureFeatureSet?: ClosuresFeatureSet
}

export interface ChangedClosuresOutput extends GetClosuresOutput {
  hasChanged: true;
  /**  A mapping of closure polygons keyed by zoom level IDs. */
  mapping: Map<number, Polygon>,
  /** Closure feature set parsed from JSON */
  closureFeatureSet: ClosuresFeatureSet
}

export interface UnchangedClosuresOutput extends GetClosuresOutput {
  hasChanged: false;
  /**  A mapping of closure polygons keyed by zoom level IDs. */
  mapping?: undefined
}

/**
 * Gets a mapping of closure polygons keyed by zoom level IDs.
 * @param url Closure FeatureSet JSON
 * @returns A mapping of closure polygons keyed by zoom level IDs.
 */
export async function getClosures(url = closureUrl): Promise<ChangedClosuresOutput | UnchangedClosuresOutput> {
  const closureFeatureSet = await getFeatureSet(url);

  const lastClosureTimeStamp = getLastClosureTimeStamp();
  const currentTimeStamp = closureFeatureSet.timestamp;

  console.debug("getClosures timestamps", {
    lastClosureTimeStamp,
    currentTimeStamp
  });

  // Exit if the features have not changed since last refresh.
  if (currentTimeStamp <= lastClosureTimeStamp) {
    return {
      hasChanged: false,
      closureFeatureSet
    }
  }

  // // ArcGIS stores date values as integers. Since we're just comparing them
  // // they will be left that way instead of converting them to Date objects.
  // const previousLastClosureDateFromStorage = sessionStorage.getItem(lastClosureDateSessionStorageKey);
  // // Convert the value from session storage into a number, or set to zero if a value hasn't been defined yet.
  // const previousLastClosureDate = previousLastClosureDateFromStorage
  //   ? parseInt(previousLastClosureDateFromStorage)
  //   : 0;

  // let lastClosureDate = 0;

  if (closureFeatureSet.features == null) {
    const errorMessage = `Feature set's "features" property is undefined.`;
    throw new Error(errorMessage);
  }

  const closureLines = new Array<Polyline>();
  for (const { polyline } of enumerateFeatures(closureFeatureSet)) {
    // lastClosureDate = latestDate;
    closureLines.push(polyline);
  }

  // if (lastClosureDate > previousLastClosureDate) {
  //   sessionStorage.setItem(lastClosureDateSessionStorageKey, lastClosureDate.toString(10));
  // }

  const clippingMaskPromises = ZoomLevelBufferMap.map(async ({ bufferSize, zoomLevel }) => {
    const clippingMask = await getClippingMask(bufferSize, closureLines);
    return [zoomLevel, clippingMask] as [number, Polygon];
  });

  const mapping = new Map(await Promise.all(clippingMaskPromises));
  setLastClosureTimeStamp(closureFeatureSet.timestamp);
  return {
    hasChanged: true,
    mapping,
    closureFeatureSet
  }
}
