import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

let gl;
let seg = 144;
let cubeRotation = {'x':0.0, 'y':0.0, 'z':0.0, 'pan':0.0, 'fov':45};
let pov = {'heading':0.0, 'pitch':0.0};
let deltaTime = 0;
let video = document.createElement("video");
let track = document.createElement("track");
// document.body.appendChild(video);
video.appendChild(track);
// will set to true when video can be copied to texture
let copyVideo = false;

main();

//
// start here
//
function main() {
  const canvas = document.querySelector("#glcanvas");
  // Initialize the GL context
  gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  // Set clear color to transparent
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Vertex shader program

  const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec3 aVertexNormal;
  attribute vec2 aTextureCoord;

  uniform mat4 uNormalMatrix;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying highp vec4 vVertexPosition;
  varying highp vec2 vTextureCoord;
  varying highp vec3 vLighting;
  
  uniform sampler2D uSampler;

  void main(void) {
    highp vec2 vDepthCoord = aTextureCoord;
    
    vTextureCoord = aTextureCoord;
    vDepthCoord.y = vDepthCoord.y - 0.5;
    highp vec4 texelColor = texture2D(uSampler, vDepthCoord);
    
    vVertexPosition = aVertexPosition;
    highp float avg = 1.0 - (texelColor.r + texelColor.g + texelColor.b) / 3.0;
    vVertexPosition.x = vVertexPosition.x * avg;
    vVertexPosition.y = vVertexPosition.y * avg;
    vVertexPosition.z = vVertexPosition.z * avg;
    
    gl_Position = uProjectionMatrix * uModelViewMatrix * vVertexPosition;

    // Apply lighting effect

    highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

    highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
    vLighting = ambientLight + (directionalLightColor * directional);
  }
`;

  // Fragment shader program

  const fsSource = `
  varying highp vec2 vTextureCoord;
  varying highp vec3 vLighting;

  uniform sampler2D uSampler;

  void main(void) {
    highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

    if (texelColor.r == 1.0 && texelColor.g == 1.0 && texelColor.b == 1.0 && texelColor.a == 1.0) {
      discard;
    } else {
      highp float vAlpha = texelColor.a;
      gl_FragColor = vec4(texelColor.rgb * vLighting, vAlpha);
    }
  }
`;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVertexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
      uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl, seg);
  const texture = initTexture(gl);
  
  const video = setupVideo("./comp_result.mp4");

  // Flip image pixels into the bottom-to-top order that WebGL expects.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  let then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;

    if (copyVideo) {
      updateTexture(gl, texture, video);
    }

    if (document.querySelector("#time").value != parseInt(video.currentTime)) {
      document.querySelector("#time").value = parseInt(video.currentTime);
      if (povs[document.querySelector("#time").value]) {
        pov.heading = parseFloat(povs[document.querySelector("#time").value][0]);
        pov.pitch = parseFloat(povs[document.querySelector("#time").value][1]);
      } else {
        pov.heading = 0.0
        pov.pitch = 0.0;
      }
    }
    drawScene(gl, programInfo, buffers, texture, cubeRotation, seg, pov);
    
    if (snapshot === true) {
      getSnapshot();
    }
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    );
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function initTexture(gl) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because video has to be download over the internet
  // they might take a moment until it's ready so
  // put a single pixel in the texture so we can
  // use it immediately.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 0, 255]); // opaque black
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  // Turn off mips and set wrapping to clamp to edge so it
  // will work regardless of the dimensions of the video.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  return texture;
}

function updateTexture(gl, texture, video) {
  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    srcFormat,
    srcType,
    video
  );
}

function setupVideo(url) {
  video.crossorigin = 'anonymous';

  let playing = false;
  let timeupdate = false;

  video.playsInline = true;
  video.muted = true;
  video.loop = true;
  
  track.kind = 'metadata';
  track.default = true;
  track.src = url.replace('.mp4', '.vtt');

  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      timepoints = this.responseText.slice(8).split("\n\n");
      for (var i=0; i<timepoints.length; i++) {
        timepoints[i] = timepoints[i].split('\n')[2].split(' ')[1];
        povs[i] = timepoints[i].split(',');
      }
    }
  };
  xhttp.open("GET", track.src);
  xhttp.send(); 

  // Waiting for these 2 events ensures
  // there is data in the video

  video.addEventListener(
    "playing",
    () => {
      playing = true;
      checkReady();
    },
    true
  );

  video.addEventListener(
    "timeupdate",
    () => {
      document.querySelector("#time").max = video.duration-1;
      timeupdate = true;
      checkReady();
    },
    true
  );

  video.src = url;
  video.oncanplaythrough = function() {
    video.textTracks[0].mode = 'showing';
    for (var i=0; i<video.textTracks[0].cues.length; i++) {
      video.textTracks[0].cues[i].line = 0;
    }
    video.play();
  }

  function checkReady() {
    if (playing && timeupdate) {
      copyVideo = true;
    }
  }
  return video;
}

function seek(t) {
  video.pause();
  video.currentTime = t;
  if (video.currentTime > video.duration) {
    video.currentTime = video.duration;
  } else if (video.currentTime < 0) {
    video.currentTime = 0;
  }
}

function getSnapshot() {
  var durl = document.querySelector("#glcanvas").toDataURL();
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = 'none';
  a.href = durl;
  a.download = 'snapshot.png';
  a.click();
  document.body.removeChild(a);
  snapshot = false;
}

var mediaRecorder, stream, vid;
var recordedChunks = [];

function recordCanvas(e) {
  try {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    e.target.value = '●';
  } else {
    if (!stream) {
			stream = gl.canvas.captureStream(25);
			mediaRecorder = new MediaRecorder(stream);
		}
    mediaRecorder.start(0); //time offset

    mediaRecorder.ondataavailable = function (event) {
        recordedChunks.push(event.data);
    }
    mediaRecorder.onstop = function (event) {
        var blob = new Blob(recordedChunks, {
            'type': 'video/mp4'
        });
        var url = URL.createObjectURL(blob);
        var xhr = new XMLHttpRequest;
        xhr.responseType = 'blob';
        
        xhr.onload = function() {
            var recoveredBlob = xhr.response;
            var reader = new FileReader;
            reader.onload = function() {
              const a = document.createElement('a');
              document.body.appendChild(a);
              a.style.display = 'none';
              a.href = reader.result;
              a.download = 'video.mp4';
              a.click();
              document.body.removeChild(a);
              recordedChunks = [];
            };
            reader.readAsDataURL(recoveredBlob);
        };
        xhr.open('GET', url);
        xhr.send();
    }
    e.target.value = '■';
  }
  } catch(e) {alert(e);}
}

function handleFiles(e) {
  if (!e.target.files.length) {
    alert("No files selected!");
  } else {
    video.oncanplaythrough = function(e) {
      video.play();
		}
    video.pause();
    video.currentTime = 0;
    video.src = URL.createObjectURL(e.target.files[0]);
  }
}

var timepoints = [];
var povs = [];

function handleSubs(e) {
  if (!e.target.files.length) {
    alert("No subtitles selected!");
  } else {
    povs = [];
    timepoints = [];
    var reader = new FileReader();
    reader.readAsText(e.target.files[0], "UTF-8");
    reader.onload = function (evt) {
        alert(evt.target.result);
        timepoints = evt.target.result.slice(8).split("\n\n");
        for (var i=0; i<timepoints.length; i++) {
          timepoints[i] = timepoints[i].split('\n')[2].split(' ')[1];
          povs[i] = timepoints[i].split(',');
        }
        video.play();
    }
    reader.onerror = function (evt) {
        alert("Error reading file");
    }
    track.src = URL.createObjectURL(e.target.files[0]);
  }
}

document.querySelector("#files").addEventListener("change", handleFiles);
document.querySelector("#subs").addEventListener("change", handleSubs);

document.querySelector("#glcanvas").addEventListener('click', function(e){
  if (gl.canvas.style.width == '320px') {
    gl.canvas.style.width = (window.innerWidth-16) + 'px';
    gl.canvas.style.height = window.innerHeight + 'px';
    gl.canvas.style.marginRight = '16px';
  } else {
    gl.canvas.style.width = '320px';
    gl.canvas.style.height = '240px';
    gl.canvas.style.marginRight = '0px';
  }
});

document.querySelector("#record").addEventListener('click', function(e){
  recordCanvas(e);
});

var snapshot = false;
document.querySelector("#snapshot").addEventListener('click', function(e){
  snapshot = true;
});

document.querySelector("#pan").addEventListener('input', function(e){
  cubeRotation.pan = e.target.value;
});

document.querySelector("#fov").addEventListener('input', function(e){
  cubeRotation.fov = e.target.value;
});

document.querySelector("#time").addEventListener('input', function(e){
  seek(e.target.value);
});

document.querySelector("#glcanvas").addEventListener('wheel', function(e){
  cubeRotation.fov += e.deltaY;
  document.querySelector("#fov").value = cubeRotation.fov;
});

var md = false;
var xold, yold;
document.querySelector("#glcanvas").addEventListener('pointermove', function(e){
  if (md === true) {
    cubeRotation.y += e.clientX - xold;
    cubeRotation.x += e.clientY - yold;
    xold = e.clientX;
    yold = e.clientY;
  }
});

document.querySelector("#glcanvas").addEventListener('pointerdown', function(e){
  md = true;
  xold = e.clientX;
  yold = e.clientY;
});

document.querySelector("#glcanvas").addEventListener('pointerup', function(e){
  md = false;
});

document.querySelector("#glcanvas").addEventListener('pointerout', function(e){
  md = false;
});

document.querySelector("#glcanvas").addEventListener('pointerleave', function(e){
  md = false;
});

document.querySelector("#glcanvas").addEventListener('pointercancel', function(e){
  md = false;
});
