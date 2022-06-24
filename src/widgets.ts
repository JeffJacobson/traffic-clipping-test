// Widgets
import MapView from '@arcgis/core/views/MapView';
import Home from '@arcgis/core/widgets/Home';
import Search from '@arcgis/core/widgets/Search';
import Locate from '@arcgis/core/widgets/Locate';
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import Expand from "@arcgis/core/widgets/Expand";
import { waExtentGeographic } from './WAExtent';

interface Params {
  view: MapView;
}

export function initWidgets({ view }: Params): MapView {
  var home = new Home({ view: view });
  view.ui.add(home, 'top-left');

  const sources: __esri.LocatorSearchSourceProperties[] = [
    {
      url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer',
      countryCode: 'US',
      name: 'World Geocode Service',
      // Set the extent to WA. Values from http://epsg.io/1416-area.
      filter: {
        geometry: waExtentGeographic,
      },
    },
  ];

  const search = new Search({
    view,
    includeDefaultSources: false,
    sources,
  });
  view.ui.add(search, 'top-right');

  const locate = new Locate({ view: view });
  view.ui.add(locate, 'top-left');




  view.when((() => {
    const basemapGallery = new BasemapGallery({
      view
    });
    const bmExpand = new Expand({
      content: basemapGallery
    });
    view.ui.add(bmExpand, "top-left");
  }))
  return view;
}
