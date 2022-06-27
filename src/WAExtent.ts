/**
 * This module provides WA state extent
 * in WGS 84 and Web Mercator.
 * @module
 */

import Extent from '@arcgis/core/geometry/Extent';
import { geographicToWebMercator } from '@arcgis/core/geometry/support/webMercatorUtils';
const [xmin, ymin, xmax, ymax] = [-116.91, 45.54, -124.79, 49.05];
export const waExtentGeographic = new Extent({ xmin, ymin, xmax, ymax, spatialReference: { wkid: 4326 } });
export const waExtentWebMercator = geographicToWebMercator(waExtentGeographic) as Extent;
