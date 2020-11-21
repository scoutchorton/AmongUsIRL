/**
 * Initalize Socket.io
 */
const socket = io();


/**
 * Variables
 */
let code = undefined;
let backgroundFlash = undefined;

/**
 * SVG interaction
 */
function updateStickyNote(data) {
	document.getElementById('o2panel').contentDocument.getElementById('stickyCode').innerHTML = data;
}

function clearPanelInput() {
	document.getElementById('o2panel').contentDocument.getElementById('o2input').innerHTML = "";
}
function updatePanelInput(data) {
	document.getElementById('o2panel').contentDocument.getElementById('o2input').innerHTML += data;
}
function getPanelInput() {
	return document.getElementById('o2panel').contentDocument.getElementById('o2input').innerHTML;
}


/**
 * Panel logic
 */
document.getElementById('o2panel').addEventListener('load', (e) => {
	//Set sticky note contents
	for(let ele of e.target.contentDocument.getElementsByClassName('o2button')) {
		//Clicking on a panel button
		ele.addEventListener('click', (e) => {
			//Find element that is the actual SVG group
			e.path.forEach(target => {
				if(target.classList) {
					if(target.classList.contains('o2button')) {
						//Clear button
						if(target.id == "clear") {
							clearPanelInput();
						//Enter button
						} else if(target.id == "enter" && getPanelInput().length == code.length) {
							if(getPanelInput() == code) {
								socket.emit('sabotage', {type: 'solve', name: 'o2'});
								document.getElementById('panel_display').classList.add('hidden');
							}
							clearPanelInput();
						//Number buttons
						} else {
							if(getPanelInput().length < code.length)
								updatePanelInput(target.id);
						}
					}
				}
			});
		}, true);
	}
	clearPanelInput();
});


//User event to trigger audio
document.body.addEventListener('click', () => {
	document.getElementById('init_display').classList.add('hidden');
	document.getElementById('sabotage_alert').pause();
});


/**
 * Misc
 */
//Make the background of an element flash
function flash(element, color1, color2, interval) {
	return setInterval(() => {
		if(element.style.background == color1)
			element.style.background = color2;
		else
			element.style.background = color1;
	}, interval)
}


/**
 * Socket.io listening
 */
socket.on('sabotage', (data) => {
	console.log(`[AMNG] Sabotage event incoming...`);
	if(data.type == 'trigger' && data.name == "o2") {
		console.log(`[AMNG] O2 sabotage.`, data);
		code = data.data;
		updateStickyNote(code);
		setTimeout(() => {
			backgroundFlash = flash(document.body, 'black', 'red', 1000);
		}, 450);
		document.getElementById('panel_display').classList.remove('hidden');
		document.getElementById('sabotage_alert').play();
	} else if(data.type == "finish" && data.name == "o2") {
		document.getElementById('panel_display').classList.add('hidden');
		document.getElementById('sabotage_alert').pause();
		clearInterval(backgroundFlash);
		document.body.style.background = 'black';
	}
});

socket.on('status', (data) => {
	//Hide panel when game is over
	if(data.game == "false") {
		document.getElementById('panel_display').classList.add('hidden');
		document.getElementById('sabotage_alert').pause();
		clearInterval(backgroundFlash);
		document.body.style.background = 'pink';
	} else if(data.game == "true") {
		document.body.style.background = "black";
	}
});