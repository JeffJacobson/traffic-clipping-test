import './style.css';
import config from '@arcgis/core/config';
import EsriMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import Polygon from '@arcgis/core/geometry/Polygon';
import { initWidgets } from './widgets';
import { getClosures } from './closures';
import { waExtentWebMercator } from './WAExtent';
import CustomParameters, {createClippingCustomParams} from './CustomParameters';

config.apiKey = import.meta.env.VITE_API_KEY as string;

var map = new EsriMap({
  basemap: 'streets-navigation-vector',
});

var view = new MapView({
  container: 'viewDiv',
  map: map,
  extent: waExtentWebMercator,
  ui: {
    components: ['zoom', 'compass', 'attribution'],
  },
});


async function setupClosureMasking() {
  const trafficUrl = 'https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer';
  const trafficRefreshIntervalInMinutes = 5;
  const trafficLayer = new MapImageLayer({
    url: trafficUrl,
    sublayers: [{ id: 6 }],
    refreshInterval: trafficRefreshIntervalInMinutes,
  });

  let closureMap: Map<number, Polygon>;

  getClosures().then((maskMap) => {
    if (!maskMap) {
      throw new TypeError("maskMap should not be null or undefined", maskMap);
    }
    closureMap = maskMap;
    setTrafficLayerClippingParameters(view.zoom);
    map.add(trafficLayer);
  }, error => console.error("Failed to get closure info", error));

  function setTrafficLayerClippingParameters(zoomLevel: number) {
    if (!closureMap) {
      console.error("closureMap should not be null or undefined", closureMap);
      trafficLayer.customParameters = undefined;
    } else {
      const clipPolygon = closureMap.get(zoomLevel);
      const customParameters = createClippingCustomParams(clipPolygon || null);
      trafficLayer.customParameters = customParameters;
    }
    trafficLayer.refresh();
  }

  const zoomWatchHandle = view.watch(
    'zoom',
    (newValue: number, oldValue: number, _propertyName, _target) => {
      if (oldValue === newValue) {
        return;
      }
      setTrafficLayerClippingParameters(newValue);
    }
  );

  // Setup periodic retrieval of closure features.
  const closureRefeshIntervalId = setTimeout(async () => {
    closureMap = await getClosures();
  }, trafficRefreshIntervalInMinutes * 60 * 1000);
}

view.when(() => {
  setupClosureMasking();
  initWidgets({ view });
});


setupClosureMasking();


