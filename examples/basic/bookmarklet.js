var body = document.body;
var messageEl = document.createElement('div');
var re = /https:\/\/www.google.com\/maps\/\S*data=\S*!1s(\S+)!2e/;
var result = re.exec(window.location.href);
var buttons = document.getElementsByTagName('button');
var ids = [];
var j = 0;
for (var i=0; i<buttons.length; i++) {
	if (buttons[i].style.background.indexOf('panoid=') > -1) {
		ids[j] = buttons[i].style.background.split('panoid=')[1].split('&')[0];
		j++;
	}
}
var url = 'https://freeali.se/panoramera/examples/basic/index.html';
if (j>0) {
	window.location.href = url + '?ids=' + ids.join(',');
} else {
	window.location.href = url + '?c=' + encodeURIComponent(document.getElementById('titlecard').innerText) + '&ps=' + window.location.href.split('!1s')[1].split('!2e')[0];
}