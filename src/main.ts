import './style.css';
import config from '@arcgis/core/config';
import EsriMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import Polygon from '@arcgis/core/geometry/Polygon';
import { initWidgets } from './widgets';
import { getClosures } from './closures';
import { waExtentWebMercator } from './WAExtent';
import CustomParameters, { createClippingCustomParams } from './CustomParameters';

config.apiKey = import.meta.env.VITE_API_KEY as string;

var map = new EsriMap({
  basemap: 'dark-gray-vector',
});

var view = new MapView({
  container: 'viewDiv',
  map: map,
  extent: waExtentWebMercator,
  ui: {
    components: ['zoom', 'compass', 'attribution'],
  },
});

const trafficUrl = 'https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer';
const trafficRefreshIntervalInMinutes = 5;
const trafficLayer = new MapImageLayer({
  url: trafficUrl,
  id: "Traffic",
  sublayers: [{ id: 6 }],
  refreshInterval: trafficRefreshIntervalInMinutes,
});

trafficLayer.on("refresh", (event) => {
  console.group("traffic layer refresh handler");
  console.debug("event", event);
  console.groupEnd();
});

trafficLayer.watch("customParameters", (newValue: CustomParameters, oldValue: CustomParameters, propertyName, target) => {
  console.log("traffic layer customParameters changed", {
    oldValue,
    newValue,
    propertyName,
    target
  })
})


async function setupClosureMasking() {
  console.debug(`entering setupClosureMasking (${setupClosureMasking.name})`);


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
      trafficLayer.set("customParameters", customParameters ? JSON.stringify(customParameters) : null);
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

  console.debug("zoomWatchHandle", zoomWatchHandle);

  const closureRefreshIntervalInMilliseconds = trafficRefreshIntervalInMinutes * 60 * 1000;
  // Setup periodic retrieval of closure features.
  const closureRefreshIntervalId = setTimeout(async () => {
    closureMap = await getClosures();
  }, closureRefreshIntervalInMilliseconds);

  console.debug("closure refresh timeout created", {
    closureRefreshIntervalId,
    trafficRefreshIntervalInMinutes,
    refreshIntervalInMilliseconds: closureRefreshIntervalInMilliseconds
  });
  console.debug(`exiting setupClosureMasking (${setupClosureMasking.name})`);
}

view.when(() => {
  initWidgets({ view });
});

trafficLayer.when(() => {
  if (trafficLayer.isFulfilled()) {
    setupClosureMasking();
  }
}, (error: Error) => {
  console.error("an error occurred with the traffic layer", error);
})

map.add(trafficLayer);