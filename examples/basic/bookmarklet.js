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
if (j>0) {
	window.location.href = 'https://freeali.se/panoramera/examples/basic/index.html?ids=' + ids.join(',');
} else {
	window.location.href = 'https://lh5.googleusercontent.com/p/' + window.location.href.split('!1s')[1].split('!2e')[0] + '=w4096-h2048-k-no';
}