/**
 * Requires
 */
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require('socket.io')(http);

/**
 * Main website serving
 */
app.use(express.static('static'));

/**
 * Start Express app
 */
app.listen(8080, () => {
	console.log('[EXPR] Express loaded.');
});