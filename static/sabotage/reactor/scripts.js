/**
 * Initalize Socket.io
 */
const socket = io();


/**
 * Variables
 */
let backgroundFlash = undefined;
let scanInterval = [];
let scanPercent = 0;

/**
 * SVG interaction
 */
function clearPanelInput() {
	document.getElementById('reactorpanel').contentDocument.getElementById('reactorText').innerHTML = "";
}
function updatePanelDisplay(data) {
	document.getElementById('reactorpanel').contentDocument.getElementById('reactorText').innerHTML = data;
}


/**
 * Panel logic
 */
//Handlers to trigger scanning
let downHandler = (e) => {
	//Only one interval at a time
	if(scanInterval == undefined) {
		//Start scan from top
		scanPercent = 0;

		//Update message text
	updatePanelDisplay('WAITING FOR SECOND USER');
		
		//Set fill to gradient
		document.getElementById('reactorpanel').contentDocument.getElementById('handprint').style.fill = `url(#handprintGradient)`;
		let whiteStop = document.getElementById('reactorpanel').contentDocument.getElementById('handprintGradient').children[1];
		scanInterval = setInterval(() => {
			//Reset scan percentage
			if(scanPercent >= 200)
				scanPercent = 0;
			
			//Set gradient
			//whiteStop.setAttribute('offset', `${Math.abs(scanPercent - 100) / 100}`);
			whiteStop.setAttribute('offset', `${(Math.cos(Math.PI * (scanPercent - 100) / 100) + 1) / 2}`);
	
			//Increment counter
			scanPercent += 0.15;
		}, 3);

		//Networking
		socket.emit('sabotage', {type: 'solve', name: 'reactor'});
	}
};

let upHandler = (e) => {
	//Update visuals
	updatePanelDisplay('HOLD TO STOP MELTDOWN');
	document.getElementById('reactorpanel').contentDocument.getElementById('handprint').style.fill = 'red';

	//Stop interval
	clearInterval(scanInterval);
	scanInterval = undefined;

	//Networking
	socket.emit('sabotage', {type: 'unsolve', name: 'reactor'});
};

//Wait for vector graphics to load
document.getElementById('reactorpanel').addEventListener('load', () => {
	//Default fill and message text
	updatePanelDisplay('HOLD TO STOP MELTDOWN');
	document.getElementById('reactorpanel').contentDocument.getElementById('handprint').style.fill = 'red';
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
	if(data.type == 'trigger' && data.name == "reactor") {
		console.log(`[AMNG] Reactor sabotage.`, data);

		document.getElementById('sabotage_alert').play();
		setTimeout(() => {
			backgroundFlash = flash(document.body, 'black', 'red', 1000);
		}, 450);

		document.getElementById('panel_display').classList.remove('hidden');

		document.getElementById('reactorpanel').contentDocument.addEventListener('mousedown', downHandler);
		document.getElementById('reactorpanel').contentDocument.addEventListener('touchstart', downHandler);
		document.getElementById('reactorpanel').contentDocument.addEventListener('mouseup', upHandler);
		document.getElementById('reactorpanel').contentDocument.addEventListener('touchend', upHandler);
	} else if(data.type == "finish" && data.name == "reactor") {
		document.getElementById('sabotage_alert').pause();
		clearInterval(backgroundFlash);
		document.body.style.background = 'black';

		updatePanelDisplay('HAVE A NICE DAY!');
		document.getElementById('reactorpanel').contentDocument.getElementById('handprint').style.fill = 'cyan';

		setTimeout(() => {
			document.getElementById('panel_display').classList.add('hidden');
		}, 5000);

		document.getElementById('reactorpanel').contentDocument.removeEventListener('mousedown', downHandler);
		document.getElementById('reactorpanel').contentDocument.removeEventListener('touchstart', downHandler);
		document.getElementById('reactorpanel').contentDocument.removeEventListener('mouseup', upHandler);
		document.getElementById('reactorpanel').contentDocument.removeEventListener('touchend', upHandler);
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