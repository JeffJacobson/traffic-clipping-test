/**
 * This module sets up the map's widgets.
 * @module
 */

import MapView from '@arcgis/core/views/MapView';
import Home from '@arcgis/core/widgets/Home';
import Search from '@arcgis/core/widgets/Search';
import Locate from '@arcgis/core/widgets/Locate';
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import Expand from "@arcgis/core/widgets/Expand";
import LayerList from "@arcgis/core/widgets/LayerList";
import { waExtentGeographic } from './WAExtent';

/**
 * Parameters for widget initialization.
 */
interface Params {
  view: MapView;
}

/**
 * Initializes the view's widgets.
 * @param param0 
 * @returns 
 */
export function initWidgets({ view }: Params): MapView {
  var home = new Home({ view: view });
  view.ui.add(home, 'top-left');

  // Setup custom sources for the Search widget
  // The geocode service will be restricted US country code
  // and to WA's extent.
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

  // Setup Basemap Gallery inside of an Expand widget.
  view.when((() => {
    const basemapGallery = new BasemapGallery({
      view
    });
    const bmExpand = new Expand({
      content: basemapGallery
    });
    view.ui.add(bmExpand, "top-left");

    const layerList = new LayerList({
      view
    });

    const llExpand = new Expand({
      content: layerList,
      expanded: true
    })

    view.ui.add(llExpand, "top-right");
  }))
  return view;
}
