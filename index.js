/**
 * Requires
 */
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const QRCode = require('qrcode');
const gameSettings = require('./games/default.json');


/**
 * Game classes
 */
class Sabotage {
	//Members
	time = undefined;
	finished = 0;
	fail = false;
	eventName = "";
	cooldown = gameSettings.cooldown.sabotage;
	eventLength = 30000; //Time in milliseconds to finish event
	//eventLength = 5000; //Time in milliseconds to finish event
	data = undefined;
	
	//Methods defined outside of the class
	genData = undefined;

	constructor(eventName) {
		//Require that a name is given for a sabotage
		if(eventName == undefined || eventName.length == 0)
			throw "Must have a name for a sabotage.";
		
		this.eventName = eventName;
	}

	finish() {
		if(this.finished == 2) {
			return true;
		} else {
			return false;
		}
	}

	reset() {
		this.finished = 0;
	}
	
	solve() {
		this.finished++;
		return this.finished;
	};
	
	unsolve() {
		this.finished--;
		return this.finished;
	};

	trigger(callback) {
		//Reset finished status
		this.reset();

		//Trigger sabotage if not already triggered
		if(this.time == undefined) {
			//Generate code for O2 and whatnot
			if(this.genData)
				this.genData();
				//this.data = this.genData();
			
			//Set time to the "end" of sabotage
			this.time = new Date(new Date().getTime() + this.eventLength);

			//Check status of sabotage at end
			setTimeout(() => {
				console.log(`[AMNG] Sabotage ${this.eventName} finished. Checking status...`);
				if(this.finish() == false) {
					io.emit('status', {game: 'false'});
					console.log(`[AMNG] Sabotage ${this.eventName} failed.`);
					gameState.status = "done";
				} else {
					console.log(`[AMNG] Sabotage ${this.eventName} resolved.`);
				}
			}, this.eventLength);

			//Send message to trigger sabotage
			io.emit('sabotage', {type: 'trigger', name: this.eventName, data: this.data});
		}

		callback('ack');
		return this.time;
	}
}


/**
 * Main website serving
 */
app.use(express.static('static'));


/**
 * Start HTTP server
 */
http.listen(8080, () => {
	console.log('[EXPR] Express loaded.');
});


/**
 * Game logic
 */
const o2 = new Sabotage("o2");
o2.genData = () => {
	o2.data = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
	return o2.data;
};

const reactor = new Sabotage("reactor");

let gameState = {
	status: "done",
	colors: {
		purple: false,
		white: false,
		brown: false,
		cyan: false,
		pink: false,
		yellow: false,
		orange: false,
		green: false,
		red: false,
		lime: false,
		blue: false,
		black: false
	}
}

/**
 * Socket.io
 */
io.on('connection', (socket) => {
	console.log('Socket.io connection!');

	//Sabotage commnunication
	socket.on('sabotage', (message, callback) => {
		console.log('[AMNG] Sabotage message...')
		if(message.type == 'init') {
			console.log(`[AMNG] Triggering ${message.name}...`);
			if(message.name == "o2") {
				o2.trigger(callback);
				console.log('[AMNG] o2 has now been triggered.');
			} else if(message.name == "reactor") {
				reactor.trigger(callback);
				console.log('[AMNG] reactor has now been triggered.');
			}
		} else if(message.type == "solve") {
			if(message.name == "o2") {
				console.log('[AMNG] o2 has now been solved.');
				o2.solve();
				if(o2.finish() == true) {
					console.log('[AMNG] o2 has now been completely resolved.');
					io.emit('sabotage', {type: 'finish', name: 'o2'});
					setTimeout(() => {
						console.log('[AMNG] o2 has been reprimed.');
						io.emit('sabotage', {type: 'charge', name: 'o2'});
					}, o2.cooldown);
				}
			} else if(message.name == "reactor") {
				console.log('[AMNG] reactor has now been solved.');
				console.log(reactor.solve());
				if(reactor.finish() == true) {
					console.log('[AMNG] reactor has now been completely resolved.');
					io.emit('sabotage', {type: 'finish', name: 'reactor'});
					setTimeout(() => {
						console.log('[AMNG] reactor has been reprimed.');
						io.emit('sabotage', {type: 'charge', name: 'reactor'});
					}, o2.cooldown);
				}
			}
		} else if(message.type == "unsolve") {
			if(message.name == "reactor") {
				console.log('[AMNG] reactor has been unsolved.');
				reactor.unsolve();
			}
		}
	});

	//Game status communication
	socket.on('status', (data, callback) => {
		console.log('[AMNG] Game status incoming...');
		if(data.game == 'init') {
			console.log('[AMNG] Initalizing game...');
			if(gameState.status != "done") {
				console.log('[AMNG] Failed to initalize game: game already running.');
				callback("false");
			} else {
				gameState.status = "running";
				io.emit('status', {game: 'true'});
				console.log('[AMNG] Game started.');
			}
		} else if(data.game == 'done') {
			console.log('[AMNG] Client finished game. Resetting...');
			io.emit('status', {game: 'done'});
			gameState.status = "done";
			o2.finished = 2;
			reactor.finished = 2;
		}
	});
	
	//Player interaction
	socket.on('player', (data) => {
		console.log('[AMNG] Player data incoming...');
		//When a player selects a color
		if(data.type == 'selection') {
			console.log(`[AMNG] Player selected ${data.info}!`);
			gameState.colors[data.info] = true;
		} else if(data.type == 'deselection') {
			console.log(`[AMNG] Player deselected ${data.info}!`);
			gameState.colors[data.info] = false;
		}

		//Send color data
		io.emit('player', {type: 'selection', info: JSON.stringify(gameState.colors)});
	});

	//Gernate QR Code and send back data
	socket.on('qr', (data, callback) => {
		QRCode.toDataURL(data, {type: 'image/jpeg'}).then(callback).catch(() => {
			callback();
		});
	});
});