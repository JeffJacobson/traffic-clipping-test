import Extent from "@arcgis/core/geometry/Extent";
const [xmin, ymin, xmax, ymax] = [-116.91, 45.54, -124.79, 49.05];
export default new Extent({xmin, ymin, xmax, ymax, spatialReference: {wkid: 4326}});