var body = document.body;
var messageEl = document.createElement('div');
var re = /https:\/\/www.google.com\/maps\/\S*data=\S*!1s(\S+)!2e/;
var result = re.exec(window.location.href);
var buttons = document.getElementsByTagName('button');
var ids = [];
var ps = [];
var cs = [];
var j = 0;
for (var i=0; i<buttons.length; i++) {
	 var bsb = buttons[i].style.background;
	 if (bsb.length) {
	   if (bsb.indexOf('panoid=') >= 0) {
		    ids[j] = bsb.split('panoid=')[1].split('&')[0];
	   } else {
					  var s = bsb.lastIndexOf('/')+1;
					  ps[j] = bsb.slice(s).split('=')[0];
							if (buttons[i].innerText.trim().indexOf('\n') >= 0) {
							  cs[j] = encodeURIComponent(buttons[i].innerText.trim().replace(/\n/g, ' - '));
							} else {
							  cs[j] = encodeURIComponent(document.getElementById('titlecard').innerText.trim().replace(/\n/g, ' - '));
							}
				}
				j++;
		}
}
var url = 'https://freeali.se/panoramera/examples/basic/index.html';
if (ids.length>0) {
	 window.location.href = url + '?ids=' + ids.join(',');
} else if (ps.length>0) {
	 const l = window.location.href.split('@')[1].split('/')[0].split(',');
	 window.location.href = url + '?l=' + l[0] + ',' + l[1] 	+ '&c=' + cs.join(',') + '&ps=' + ps.join(',');
} else {
	 const l = window.location.href.split('@')[1].split('/')[0].split(',');
	 const c = encodeURIComponent(document.getElementById('titlecard').innerText.trim().replace(/\n/g, ' - '));
	 const id = window.location.href.split('!1s')[1].split('!2e')[0];
	 if (id.length > 22) {
			 if (id.slice(id.length-1) != '.') {
	     window.location.href = url + '?l=' + l[0] + ',' + l[1] 	+ '&c=' + c + '&ps=' + id;
				} else {
					 alert("Can not fetch this photo. Please click ⋮ on the title card and 'Report a problem' to download it manually.");
				}
	 } else {
		  window.location.href = url + '?ids=' + id;
 	}
}