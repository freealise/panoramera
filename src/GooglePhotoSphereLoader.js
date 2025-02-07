import { Loader } from "./Loader.js";
import { getPanoramaById, getGoogleStreetViewService } from "./utils.js";
var md = null;

// AF1QipMKVZBKb5dP2my1FWB2ljCp2vXqiISTzj056YD_
// https://www.google.com/maps/photometa/v1?authuser=0&hl=en&gl=uk&pb=!1m4!1smaps_sv.tactile!11m2!2m1!1b1!2m2!1sen!2suk!3m3!1m2!1e10!2sAF1QipMKVZBKb5dP2my1FWB2ljCp2vXqiISTzj056YD_!4m57!1e1!1e2!1e3!1e4!1e5!1e6!1e8!1e12!2m1!1e1!4m1!1i48!5m1!1e1!5m1!1e2!6m1!1e1!6m1!1e2!9m36!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e3!2b1!3e2!1m3!1e3!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e1!2b0!3e3!1m3!1e4!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e3

async function getPhotoSphereInfo(id) {
  const url = `https://www.google.com/maps/photometa/v1?authuser=0&hl=en&gl=uk&pb=!1m4!1smaps_sv.tactile!11m2!2m1!1b1!2m2!1sen!2suk!3m3!1m2!1e10!2s${id}!4m57!1e1!1e2!1e3!1e4!1e5!1e6!1e8!1e12!2m1!1e1!4m1!1i48!5m1!1e1!5m1!1e2!6m1!1e1!6m1!1e2!9m36!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e3!2b1!3e2!1m3!1e3!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e1!2b0!3e3!1m3!1e4!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e3`;
  const res = await fetch(url);
  const text = await res.text();
  const info = JSON.parse(text.substr(4));
  md = text;
  return info;
}

class GooglePhotoSphereLoader extends Loader {
  constructor() {
    super();

    this.service = getGoogleStreetViewService();
    this.zoom = 1;
    this.metadata = {};
  }

  async load(id, zoom) {
    if (zoom === undefined) {
      console.warn("No zoom provided, assuming 1");
      zoom = 1;
    }

    this.zoom = zoom;
    this.panoId = id;
    
    var w, h, tl, url, tileWidth, tileHeight;

    const metadata = await getPhotoSphereInfo(id);
    try {
      this.metadata = {
        copyright: metadata[1][0][4][1][0][0][0],
        location: {
          latLng: {
            lat: parseFloat(metadata[1][0][5][0][1][0][2]),
            lng: parseFloat(metadata[1][0][5][0][1][0][3]),
          }
        },
        tiles: {
          worldSize: {
            width: metadata[1][0][2][2][1],
            height: metadata[1][0][2][2][0],
          },
          tileSize: {
            width: metadata[1][0][2][3][1][1],
            height: metadata[1][0][2][3][1][0],
          },
          originHeading: parseFloat(metadata[1][0][5][0][1][2][0]),
          originPitch: parseFloat(metadata[1][0][5][0][1][2][1])-90.0,
          originRoll: parseFloat(metadata[1][0][5][0][1][2][2]),
        },
      };
      const widths = [];
      const levels = [];
      let level = 1;
      for (const w of metadata[1][0][2][3][0]) {
        widths.push(w[0][1]);
        levels.push(level);
        level *= 2;
      }
      
      const aspectRatio =
      this.metadata.tiles.worldSize.width /
      this.metadata.tiles.worldSize.height;

      this.canvas.width = widths[zoom];
      this.canvas.height = this.canvas.width / aspectRatio;

      w = levels[zoom];
      h = w / aspectRatio;
      
      tl = true;
    } catch(e) {
      this.metadata = {
        copyright: '',
        location: {
          latLng: {
            lat: -90.0,
            lng: -90.0,
          }
        },
        tiles: {
          worldSize: {
            width: 4096,
            height: 2048,
          },
          tileSize: {
            width: 4096,
            height: 2048,
          },
          originHeading: 180.0,
          originPitch: 0.0,
          originRoll: 0.0,
        },
      };
      
      const aspectRatio = 2;
      this.canvas.width = 4096;
      this.canvas.height = this.canvas.width / aspectRatio;

      w = 2;
      h = w / aspectRatio;
      
      tl = false;
    }
    this.metadata.reportLink = 'https:' + md.slice(md.lastIndexOf('//www.google.com/local/imagery/report')).split('"]')[0].replace('\u0026', '&');
    
    tileWidth = this.metadata.tiles.tileSize.width;
    tileHeight = this.metadata.tiles.tileSize.height;

    if (tl === true) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          url = `https://lh3.ggpht.com/p/${id}=x${x}-y${y}-z${zoom}`;
          this.stitcher.addTileTask({
            url: url,
            x: x * tileWidth,
            y: y * tileHeight,
            tileWidth: tileWidth,
            tileHeight: tileHeight
          });
        }
      }
    } else {
      url = 'https://lh5.googleusercontent.com/p/' + id + '=w' + this.canvas.width + '-h' + this.canvas.height + '-k-no';
      this.stitcher.addTileTask({
        url: url,
        x: 0,
        y: 0,
        tileWidth: tileWidth,
        tileHeight: tileHeight
      });
    }
    
    const res = await this.stitcher.process();
    return res;
  }
}

export { GooglePhotoSphereLoader };
