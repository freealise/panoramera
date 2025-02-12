# panoramera

Panorama fetching tools for JavaScript - 
import 360• photos and find their depth map for showing them in 3D with focus blur and parallax,
also remove unnecessary objects and merge different timepoints of the same place for inpainting.

Panoramera is a spiritual successor to [PanomNom.js](https://github.com/spite/PanomNom.js/) ([GSVPano.js](https://github.com/spite/GSVPano.js/)), the new version of which had been updated to use ES6 features like modules and async/await.

Current supported sources

- Google Street View panoramas
- Google PhotoSpheres (seems flaky since servers sometimes don't return a CORS header)
- Google Street View panorama depth and planes info (mostly working)

### How to use

Include the google maps API for the services to resolve metadata.

```javascript
<script src="https://maps.google.com/maps/api/js"></script>
```

Include the library or the module. You can import the functions separatedly from the `/src` folder, or from the `PanomNom.module` file.

There are two loaders, one for Street View panoramas and another for PhotoSpheres.

# GoogleStreetViewLoader

```javascript
import { GoogleStreetViewLoader } from "./PanomNom.module.js";
```

Create a loader:

```javascript
const loader = new GoogleStreetViewLoader();
```

Then `loader.load` takes an id and a zoom level (1-5, default 1). There are a few helper methods to retrieve panoIds.

```javascript
/* Load from ID: pano id, zoom 3 */
await loader.load(panoId, 3);

/* Load from location: google.maps.LatLng, zoom default 1 */
import { getIdByLocation } from "./PanonomNom.module.js";
const data = await getIdByLocation(pos.lat, pos.lng);
await loader.load(data.data.location.pano);

/* Load from URL: URL from maps.google.com, zoom 2 */
import { getIdFromURL } from "./PanonomNom.module.js";
const id = getIdFromURL(url);
await loader.load(id, 2);
```

Once the panorama is loaded, `loader.canvas` has the resulting stitched image.

**Note: getIdByLocation will only return ids valid for Street View panoramas**

You can use `loader.onProgress` to track loading progress:

```javascript
loader.onProgress((p) => {
  console.log(`Loaded ${p.toFixed(0)}%`);
});
```

# About copyright notice

Very important: `loader.metadata.copyright` should contain the copyright notice for the retrieves images. You should display it somewhere in your page.

# Examples

Please see the examples folder for proper implementations of each case.

[Street View panorama from id](https://freealise.github.io/PanomNom.js/examples/basic/sv-panoid.html)  
[Street View panorama from lat,lng](https://freealise.github.io/PanomNom.js/examples/basic/sv-location.html)  
[Street View panorama from URL](https://freealise.github.io/PanomNom.js/examples/basic/sv-url.html)

A more complete example, with Leaflet map control and more:

[Floating Shiny Knot](https://spite.github.io/FloatingShinyKnot/)

# License

MIT licensed

Copyright (C) 2022 Jaume Sanchez Elias http://twitter.com/thespite

http://www.clicktorelease.com

# streetview-panoid-bookmarklet

Browser toolbar bookmarklet to extract panorama ids from a Google StreetView URL.  
Is a fork of: https://sjwilliams.github.io/streetview-panoid-bookmarklet/  
License: MIT  
