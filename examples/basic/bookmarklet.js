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
var message = "PanoID: ";
if (result) {
	message = message + result[1] + '<br/><a href="https://freeali.se/PanomNom.js/examples/basic/sv-panoid.html?ids=' + ids.join(',') + '">load timepoints</a>';
} else {
	message = "PanoID not found."
}

messageEl.innerHTML = message;
body.appendChild(messageEl);
messageEl.style.zIndex = 2147483647;
messageEl.style.position = "fixed";
messageEl.style.top = "0";
messageEl.style.right = "0";
messageEl.style.fontFamily = "Arial, sans-serif";
messageEl.style.fontWeight = "bold";
messageEl.style.fontSize = "24px";
messageEl.style.backgroundColor = "#f4ff60";
messageEl.style.color = '#000000';
messageEl.style.padding = "20px 20px 20px 20px";
console.log(message);