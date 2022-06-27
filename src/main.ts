import './style.css';
import config from '@arcgis/core/config';
import EsriMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import { initWidgets } from './widgets';
import { ChangedClosuresOutput, getClosures, UnchangedClosuresOutput } from './closures';
import { waExtentWebMercator } from './WAExtent';
import { createClippingParameter } from './CustomParameters';
import type { InterceptBefore } from "./interceptor"

config.apiKey = import.meta.env.VITE_API_KEY as string;

let closureMap: Map<number, Polygon>;

const trafficUrl = 'https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer';

const closuresLayer = new GraphicsLayer({
  title: "Closures",
});

var map = new EsriMap({
  basemap: 'dark-gray-vector',
  layers: [
    closuresLayer
  ]
});

var view = new MapView({
  container: 'viewDiv',
  map: map,
  extent: waExtentWebMercator,
  ui: {
    components: ['zoom', 'compass', 'attribution'],
  },
});

// Intercept the traffic service and add clipping polygon.
// See https://developers.arcgis.com/javascript/latest/api-reference/esri-config.html#request
config.request.interceptors?.push({
  urls: trafficUrl,
  before: function (params: InterceptBefore) {
    console.debug("traffic request interceptor before", params);
    if (closureMap && view.ready) {
      const clippingPolygon = closureMap.get(view.zoom) || null;
      const clipping = createClippingParameter(clippingPolygon);
      params.requestOptions.query.clipping = JSON.stringify(clipping);
    }
  },
  // use the AfterInterceptorCallback to check if `ssl` is set to 'true'
  // on the response to the request, if it's set to 'false', change
  // the value to 'true' before returning the response
  after: function (response: __esri.RequestResponse) {
    console.debug("traffic request interceptor after", response)
    if (!response.ssl) {
      response.ssl = true;
    }
  }
})




const trafficRefreshIntervalInMinutes = 5;
const trafficLayer = new MapImageLayer({
  url: trafficUrl,
  id: "Traffic",
  sublayers: [{ id: 6 }],
  refreshInterval: trafficRefreshIntervalInMinutes,
  visible: false
});

function triggerWindowsClosureUpdateEvent(closuresResponse: ChangedClosuresOutput | UnchangedClosuresOutput) {
  if (!closuresResponse.hasChanged) {
    return;
  }

  const customEvent = new CustomEvent("closures-updated", {
    detail: closuresResponse
  });
  window.dispatchEvent(customEvent);
}

const closureSymbol = new SimpleLineSymbol({
  color: "red",
  style: 'dash',
  width: 2
})

window.addEventListener("closures-updated", (ev: any) => {
  const closuresOutput = ev.detail as ChangedClosuresOutput;
  closureMap = closuresOutput.mapping;
  closuresLayer.removeAll();
  for (const feature of closuresOutput.closureFeatureSet.features) {
    feature.symbol = closureSymbol;
  }
  closuresLayer.addMany(closuresOutput.closureFeatureSet.features);
  trafficLayer.refresh();
  trafficLayer.visible = true
}, {
  passive: true
})

async function setupClosureMasking() {
  console.debug(`entering setupClosureMasking (${setupClosureMasking.name})`);



  getClosures().then((closuresResponse) => {
    triggerWindowsClosureUpdateEvent(closuresResponse);
    // closureMap = closuresResponse.mapping;
  }, error => console.error("Failed to get closure info", error));

  const closureRefreshIntervalInMilliseconds = trafficRefreshIntervalInMinutes * 60 * 1000;
  // Setup periodic retrieval of closure features.
  const closureRefreshIntervalId = setTimeout(async () => {
    const closuresResponse = await getClosures();
    triggerWindowsClosureUpdateEvent(closuresResponse);
    // if (closuresResponse.hasChanged) {
    //   closureMap = closuresResponse.mapping;
    // }
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