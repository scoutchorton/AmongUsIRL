/**
 * Initalize Socket.io
 */
let socket = io();


/**
 * Request QR Code
 */
socket.emit('qr', location.href, (imgData) => {
	document.getElementById('qrcode').src = imgData;
	document.getElementById('address').innerText = location.href;
});