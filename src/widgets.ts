// Widgets
import MapView from '@arcgis/core/views/MapView';
import Home from "@arcgis/core/widgets/Home";
import Search from "@arcgis/core/widgets/Search";
import Locate from "@arcgis/core/widgets/Locate";
import WAExtent from "./WAExtent";

interface Params {
  view: MapView;
}

export function initWidgets({ view }: Params): MapView {
  var home = new Home({ view: view });
  view.ui.add(home, "top-left");

  const sources: __esri.LocatorSearchSourceProperties[] = [
    {
      url:
        "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
      countryCode: "US",
      name: "World Geocode Service",
      // Set the extent to WA. Values from http://epsg.io/1416-area.
      filter: {
        geometry: WAExtent
      }
    }
  ];

  const search = new Search({
    view,
    includeDefaultSources: false,
    sources
  });
  view.ui.add(search, "top-right");

  const locate = new Locate({ view: view });
  view.ui.add(locate, "top-left");
  return view;
}
