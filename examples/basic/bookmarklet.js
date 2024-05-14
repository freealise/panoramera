var body = document.body;
var messageEl = document.createElement('div');
var re = /https:\/\/www.google.com\/maps\/\S*data=\S*!1s(\S+)!2e/;
var result = re.exec(window.location.href);
var buttons = document.getElementsByTagName('button');
var ids = [];
ids[0] = result[1];
var j = 1;
for (var i=1; i<buttons.length; i++) {
	if (buttons[i].style.background.indexOf('panoid=') > -1) {
		ids[j] = buttons[i].style.background.split('panoid=')[1].split('&')[0];
		j++;
	}
}
if (result) {
	window.location.href = 'https://freeali.se/PanomNom.js/examples/basic/sv-panoid.html?ids=' + ids.join(',');
} else {
	alert("PanoID not found.");
}