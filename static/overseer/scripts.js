/**
 * Initalize Socket.io
 */
const socket = io();

/**
 * Page interaction
 */
//Data on event triggering
let trigger = {
	time: undefined,
	event: ""
};
let delay = 5000;
//let delay = 60000;

function primeSabotage(e, name) {
	console.log(`PRIMING ${name}...`);

	//Triggering an event 
	if(trigger.time == undefined) {
		trigger.time = new Date(new Date().getTime() + delay);
		trigger.event = name;
		//document.body.style.background = "lightgreen";
		e.target.style.background = "lightgreen";
		setTimeout(() => {
			e.target.style.background = "transparent";
		}, 500);

		//Send out sabotage event after cooldown
		setTimeout(() => {
			console.log(`PRIMED ${name}!`);
			socket.emit('sabotage', {type: 'init', name: trigger.event}, (status) => {
				if(status == "ack") {
					console.log('SUCCESS.');
				}
			});
			e.target.classList.add('disabled');
		}, trigger.time - new Date().getTime());
	}
}

function chargeSabotage(name) {
	console.log(`CHARGED ${name}!`);
	document.getElementById(name).classList.remove('disabled');
}

//Detect O2 button being pressed
document.getElementById('o2').addEventListener('click', (e) => { console.log("PRESSED"); primeSabotage(e, 'o2'); });
document.getElementById('reactor').addEventListener('click', (e) => { console.log("PRESSED"); primeSabotage(e, 'reactor'); });

//Detect start button being pressed
document.getElementById('start').addEventListener('click', () => {
	console.log('[AMNG] Initalizing game...');
	socket.emit('status', {game: 'init'}, (status) => {
		if(status == "false")
			console.log("[AMNG] Failed to start game.");
	});
});

//Detect done button being pressed
document.getElementById('done').addEventListener('click', () => {
	console.log('[AMNG] Ending game...');
	socket.emit('status', {game: 'done'});
})

/**
 * Socket.io listening
 */
socket.on('status', (data) => {
	console.log('[AMNG] Game status incoming...');
	if(data.game == "false") {
		console.log('[AMNG] Game over.');
		document.body.style.background = "pink";
		document.getElementById('sabotage_display').classList.add('hidden');
		document.getElementById('start_display').classList.remove('hidden');
		chargeSabotage('reactor');
		chargeSabotage('o2');
	} else if(data.game == "done") {
		console.log('[AMNG] Game over.');
		document.body.style.background = "lightgrey";
		document.getElementById('sabotage_display').classList.add('hidden');
		document.getElementById('start_display').classList.remove('hidden');
		chargeSabotage('reactor');
		chargeSabotage('o2');
	} else if(data.game == "true") {
		console.log('[AMNG] Game started.');
		document.body.style.background = "lightgrey";
		document.getElementById('sabotage_display').classList.remove('hidden');
		document.getElementById('start_display').classList.add('hidden');
	}
});

socket.on('sabotage', (data) => {
	if(data.type == "finish") {
		trigger.event = "";
		trigger.time = undefined;
	} else if(data.type == "charge")
		chargeSabotage(data.name);
});