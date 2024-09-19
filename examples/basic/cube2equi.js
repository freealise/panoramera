//Original code by Richard Morris © 2015
//https://jsfiddle.net/SalixAlba/wdyohqs8/
var fileList = document.getElementById('fileList');

var info = [
    { name: "left",  imageData: 0 },
    { name: "front",  imageData: 0 },
    { name: "right", imageData: 0 },
    { name: "back",  imageData: 0 },
    { name: "top",   imageData: 0 },
    { name: "bottom",  imageData: 0 },
];

var sourceImageSize;
var eqrImageWidth = sourceImageSize * 4;
var eqrImageHeight = eqrImageWidth / 2;
var outputContext = 0;
var outputImageData = 0;

function cube2equi(image, isDepth) {

    sourceImageSize = Math.round(image.width / 4);
    eqrImageWidth = sourceImageSize * 4;
    eqrImageHeight = eqrImageWidth / 2;

    var canvas;

    for (var i = 0, canvas; i < info.length; ++i) {
    
        fileList.innerText = "Loading cube side "+(i+1); 
        canvas = document.createElement("canvas");
        canvas.id = info[i].name;

        canvas.width = sourceImageSize.toString();
        canvas.height = sourceImageSize.toString();
        canvas.style.position = "absolute";
        canvas.style.left = i * (sourceImageSize + 10) + "px";
        canvas.style.top = "0px";
        canvas.style.display = "none";
        document.body.appendChild(canvas);
        context = canvas.getContext("2d");
        
        if (info[i].name != "top" && info[i].name != "bottom") {
          var x = sourceImageSize*i+1;
          var y = sourceImageSize+1;
        } else {
          var x = sourceImageSize+1;
          var y = sourceImageSize*(i-4)*2+1;
        }
        if (isDepth === true) {
          context.drawImage(image, x, y, sourceImageSize-2, sourceImageSize-2, 1, 1, sourceImageSize-2, sourceImageSize-2);
          var r = sourceImageSize/2*Math.sqrt(2);
          const grd = ctx.createRadialGradient(x+sourceImageSize/2, y+sourceImageSize/2, 0, x+sourceImageSize/2, y+sourceImageSize/2, r);
					grd.addColorStop(0, 'rgba(255, 255, 255, '+ 1-1/Math.sqrt(2) +')');
					grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
					context.fillStyle = grd;
					context.beginPath();
          context.arc(x+sourceImageSize/2, y+sourceImageSize/2, r, 0, 2 * Math.PI);
          context.fill();
        }
        /*context.beginPath();
        context.rect(0, 0, sourceImageSize, sourceImageSize);
        context.fillStyle = "hsl(" + (i / info.length) * 360 + ", 60%, 75%)";
        context.fill();

        var num_lines = 15;
        for (var x = 0; x < num_lines; ++x) {

            context.beginPath();
            context.moveTo(sourceImageSize * x / num_lines, 0);
            context.lineTo(sourceImageSize * x / num_lines, sourceImageSize);
            context.stroke();

            context.beginPath();
            context.moveTo(0, sourceImageSize * x / num_lines);
            context.lineTo(sourceImageSize, sourceImageSize * x / num_lines);
            context.stroke();
        }

        context.font = "40px Sans-serif"
        context.strokeStyle = 'black';
        context.lineWidth = 8;
        context.textAlign = 'center';
        context.strokeText(info[i].name, (canvas.width / 2), (canvas.height / 2) + 20);
        context.fillStyle = '#6a6';
        context.fillText(info[i].name, (canvas.width / 2), (canvas.height / 2) + 20);
        */
        info[i].imageData = context.getImageData(0, 0, sourceImageSize, sourceImageSize);
    }

    canvas = document.createElement("canvas");
    canvas.id = "output";
    canvas.width = eqrImageWidth.toString();
    canvas.height = eqrImageHeight.toString();
    canvas.style.position = "absolute";
    canvas.style.left = "0px"
    canvas.style.top = sourceImageSize + 10 + "px";
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    outputContext = canvas.getContext("2d");
    outputImageData = outputContext.getImageData(0, 0, eqrImageWidth, eqrImageHeight);

    fileList.innerText = "Calculating..."; 
    //constructEquirectangularImage();
    backwardsConstructEquirectangularImage();
    outputContext.putImageData(outputImageData, 0, 0);
    
    fileList.innerText = "Panorama from cube map completed"; 
    return canvas.toDataURL();
}

function clamp(v, lo, hi) {

    return Math.min(hi, Math.max(lo, v));
}


function cot(angle) {
    return 1/Math.tan(angle)
}

function cos(angle) {
    return Math.cos(angle)
}
function sin(angle) {
    return Math.sin(angle)
}
function tan(angle) {
    return Math.tan(angle)
}

// Project polar coordinates onto a surrounding cube
// assume ranges theta is [0,pi] with 0 the north poll, pi south poll
// phi is in range [0,2pi] 
function projection(theta,phi) { 
				let pi = Math.PI;
        if(theta<0.615)
            return projectTop(theta,phi)
        else if(theta>2.527)
            return projectBottom(theta,phi)
        else if(phi <= pi/4 || phi > 7*pi/4)
            return projectLeft(theta,phi)
        else if(phi > pi/4 && phi <= 3*pi/4)
            return projectFront(theta,phi)
        else if(phi > 3*pi/4 && phi <= 5*pi/4)
            return projectRight(theta,phi)
        else if(phi > 5*pi/4 && phi <= 7*pi/4)
            return projectBack(theta,phi);
}

function projectLeft(theta,phi) {
        x = 1
        y = tan(phi)
        z = cot(theta) / cos(phi)
        if(z < -1)
            return projectBottom(theta,phi);
        if(z > 1)
            return projectTop(theta,phi);
        return ["Left",x,y,z];
}

function projectFront(theta,phi){
        x = tan(phi-Math.PI/2)
        y = 1
        z = cot(theta) / cos(phi-Math.PI/2)
        if(z < -1)
            return projectBottom(theta,phi)
        if(z > 1)
            return projectTop(theta,phi)
        return ["Front",x,y,z]
}

function projectRight(theta,phi) {
        x = -1
        y = tan(phi)
        z = -cot(theta) / cos(phi)
        if(z < -1)
            return projectBottom(theta,phi)
        if(z > 1)
            return projectTop(theta,phi)
        return ["Right",x,-y,z]
}

function projectBack(theta,phi) {
        x = tan(phi-3*Math.PI/2)
        y = -1
        z = cot(theta) / cos(phi-3*Math.PI/2)
        if(z < -1)
            return projectBottom(theta,phi)
        if(z > 1)
            return projectTop(theta,phi)
        return ["Back",-x,y,z]
}

function projectTop(theta,phi) {
        // (a sin θ cos ø, a sin θ sin ø, a cos θ) = (x,y,1)
        a = 1 / cos(theta)
        x = tan(theta) * cos(phi)
        y = tan(theta) * sin(phi)
        z = 1
        return ["Top",x,y,z]
}

function projectBottom(theta,phi) {
        // (a sin θ cos ø, a sin θ sin ø, a cos θ) = (x,y,-1)
        a = -1 / cos(theta)
        x = -tan(theta) * cos(phi)
        y = -tan(theta) * sin(phi)
        z = -1
        return ["Bottom",x,y,z]
}

function cubeToImg(coords,edge) {
		let im_coord // pixel coords for image
    if(coords[0]=="Left")
        im_coord = [Math.round(edge*(coords[2]+1)/2), Math.round(edge*(1-coords[3])/2 )]
    else if(coords[0]=="Front")
        im_coord = [Math.round(edge*(coords[1]+3)/2), Math.round(edge*(1-coords[3])/2) ]
    else if(coords[0]=="Right")
        im_coord = [Math.round(edge*(1-coords[2])/2), Math.round(edge*(1-coords[3])/2) ]
    else if(coords[0]=="Back")
        im_coord = [Math.round(edge*(1-coords[1])/2), Math.round(edge*(1-coords[3])/2) ]
    else if(coords[0]=="Top")
        im_coord = [Math.round(edge*(1-coords[1])/2), Math.round(edge*(1+coords[2])/2) ]
    else if(coords[0]=="Bottom")
        im_coord = [Math.round(edge*(1-coords[1])/2), Math.round(edge*(1-coords[2])/2) ]
    return im_coord
}

function copyToEquiRectImg(x,y,data,im_co) {
	let index = 0;
  if(data[0]=="Right") index=2;
  if(data[0]=="Left") index=0;
  if(data[0]=="Top") index=4;
  if(data[0]=="Bottom") index=5;
  if(data[0]=="Front") index=1;
  if(data[0]=="Back") index=3;
  
  const faceSize = sourceImageSize;
  const pA = (x + eqrImageWidth * y)*4;
  const outPos = (im_co[0] + faceSize*im_co[1] )*4;
  //if(x % 100==0 && y % 100==0) {
  //          console.log(pA,outPos,index,faceSize);
  //}
  outputImageData.data[pA+0] = info[index].imageData.data[outPos+0];
  outputImageData.data[pA+1] = info[index].imageData.data[outPos+1];
  outputImageData.data[pA+2] = info[index].imageData.data[outPos+2];
  outputImageData.data[pA+3] = info[index].imageData.data[outPos+3];
}

function backwardsConstructEquirectangularImage() {
    var faceSize = sourceImageSize;

    for(var x=0;x<eqrImageWidth;++x) {
        for(var y=0;y<eqrImageHeight;++y) {

						var phi = (x * 2 * Math.PI) / eqrImageWidth;
            var theta = (Math.PI * y) / eqrImageHeight;
            
            var data = projection(theta,phi);
						let im_coord = cubeToImg(data,faceSize);
            //if(x%100==0 && y%100==0)
            //console.log(x,y,data,im_coord);
            copyToEquiRectImg(x,y,data,im_coord);            
        }
    }
    for(var x=0;x<eqrImageWidth;++x) {
        for(var y=0;y<eqrImageHeight;++y) {
          const pA = (x + eqrImageWidth * y)*4;
					if (outputImageData.data[pA+3] < 255) {
						outputImageData.data[pA+0] = outputImageData.data[pA-4+0];
						outputImageData.data[pA+1] = outputImageData.data[pA-4+1];
						outputImageData.data[pA+2] = outputImageData.data[pA-4+2];
						outputImageData.data[pA+3] = outputImageData.data[pA-4+3];
					}
        }
    }
}

function constructEquirectangularImage() {

    var faceSize = sourceImageSize;

    var outWidth =  faceSize * 4;
    var outHeight =  faceSize * 2;

    var faceWidth = faceSize;
    var faceHeight = faceSize;

    for(faceIndex = 0; faceIndex < 6; ++faceIndex) {

        for (var j = 0; j < faceHeight; ++j) {

            for (var i = 0; i < faceWidth; ++i) {

                var x = 0.0, y = 0.0, z = 0.0;
                var a = 2.0 * i / faceWidth;
                var b = 2.0 * j / faceHeight;

                switch (faceIndex) {
                    case 0: x = 1.0 - a; y = 1.0;     z = 1.0 - b; break; // right  (+x)
                    case 1: x = a - 1.0; y = -1.0;    z = 1.0 - b; break; // left   (-x)
                    case 2: x = b - 1.0; y = a - 1.0; z = 1.0;     break; // top    (+y)
                    case 3: x = 1.0 - b; y = a - 1.0; z = -1.0;    break; // bottom (-y)
                    case 4: x = 1.0;     y = a - 1.0; z = 1.0 - b; break; // front  (+z)
                    case 5: x = -1.0;    y = 1.0 - a; z = 1.0 - b; break; // back   (-z)
                }
                var outPos = (i + j*faceSize) << 2;

                var theta = Math.atan2(y, x);
                var r = Math.sqrt(x*x+y*y);
                var phi = Math.atan2(z, r);

                var uf = 2 * faceWidth * (theta + Math.PI) / Math.PI;
                var vf = 2 * (faceHeight) * (Math.PI/2 - phi) / Math.PI;

                var ui = Math.round(uf), vi = Math.round(vf);
                var u2 = ui+1, v2 = vi+1;
                var mu = uf-ui, nu = vf-vi;

                var pA = ((ui % outWidth) + outWidth * clamp(vi, 0, outHeight-1)) << 2;
                var pB = ((u2 % outWidth) + outWidth * clamp(vi, 0, outHeight-1)) << 2;
                var pC = ((ui % outWidth) + outWidth * clamp(v2, 0, outHeight-1)) << 2;
                var pD = ((u2 % outWidth) + outWidth * clamp(v2, 0, outHeight-1)) << 2;

                outputImageData.data[pA+0] = info[faceIndex].imageData.data[outPos+0]|0;
                outputImageData.data[pA+1] = info[faceIndex].imageData.data[outPos+1]|0;
                outputImageData.data[pA+2] = info[faceIndex].imageData.data[outPos+2]|0;
                outputImageData.data[pA+3] = info[faceIndex].imageData.data[outPos+3]|0;

                outputImageData.data[pB+0] = info[faceIndex].imageData.data[outPos+0]|0;
                outputImageData.data[pB+1] = info[faceIndex].imageData.data[outPos+1]|0;
                outputImageData.data[pB+2] = info[faceIndex].imageData.data[outPos+2]|0;
                outputImageData.data[pB+3] = info[faceIndex].imageData.data[outPos+3]|0;

                outputImageData.data[pC+0] = info[faceIndex].imageData.data[outPos+0]|0;
                outputImageData.data[pC+1] = info[faceIndex].imageData.data[outPos+1]|0;
                outputImageData.data[pC+2] = info[faceIndex].imageData.data[outPos+2]|0;
                outputImageData.data[pC+3] = info[faceIndex].imageData.data[outPos+3]|0;

                outputImageData.data[pD+0] = info[faceIndex].imageData.data[outPos+0]|0;
                outputImageData.data[pD+1] = info[faceIndex].imageData.data[outPos+1]|0;
                outputImageData.data[pD+2] = info[faceIndex].imageData.data[outPos+2]|0;
                outputImageData.data[pD+3] = info[faceIndex].imageData.data[outPos+3]|0;
            }
        }
    }
    outputContext.putImageData(outputImageData, 0, 0);
}
