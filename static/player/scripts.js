/**
 * Initalize Socket.io
 */
let socket = io();

let gameState = {
	color: ""
}


/**
 * Page interaction
 */
for(let ele of document.getElementsByClassName('player_icon')) {
	ele.addEventListener('click', (e) => {
		if(!e.target.classList.contains('disabled')) {
			color = e.target.id.split('color_')[1];
			if(e.target.classList.contains('selected')) {
				socket.emit('player', {type: 'deselection', info: color});
				console.log(`[AMNG] Deselected ${color}!`);
			} else {
				socket.emit('player', {type: 'selection', info: color});
				console.log(`[AMNG] Selected ${color}!`);
			}
			gameState.color = color;
			e.target.classList.toggle('selected');
		}
	});
}


/**
 * Socket.io listening
 */
socket.on('player', (data) => {
	//When a selection event is triggered
	if(data.type == "selection") {
		//Parse incoming data
		let colorData = JSON.parse(data.info)

		//Loop over colors
		for(let color in colorData) {
			if(color != gameState.color) {
				console.log(`[AMNG] Color data: ${color}`);
				if(colorData[color])
					document.getElementById(`color_${color}`).classList.add('disabled');
				else
					document.getElementById(`color_${color}`).classList.remove('disabled');
			}
		}
	}
});

