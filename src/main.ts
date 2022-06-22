import config from '@arcgis/core/config';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import { initWidgets } from './widgets';
import { getClosures } from "./closures";

import './style.css';
import WAExtent from './WAExtent';

config.apiKey = import.meta.env.VITE_API_KEY as string;

const trafficUrl = "https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer"
const trafficLayer = new MapImageLayer({
  url: trafficUrl,
  sublayers: [{ id: 6 }],
});

trafficLayer.on("refresh", (event) => {
  event.dataChanged
});
var map = new Map({
  basemap: "streets-navigation-vector",
  layers: [
    trafficLayer
  ]
});
var view = new MapView({
  container: "viewDiv",
  map: map,
  extent: WAExtent,
  ui: {
    components: ["zoom", "compass", "attribution"]
  }
});

view.when(() => initWidgets({ view }));
