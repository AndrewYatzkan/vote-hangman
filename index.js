// vvvv for debugging
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/votes.html');
});

var votes = {};
var used = [];
var voters = [];

io.on('connection', (socket) => {
	// console.log(`Socket connected.`);
	socket.emit('votes', votes);
	socket.on('vote end', (winner) => {
		console.log(`vote end`);
		if (winner) used.push(winner);
		voters = [];
		votes = {};
		io.emit('votes', votes);	
	});

	socket.on('game over', () => {
		console.log(`game over/reset`);
		used = [];
	});
});

http.listen(port, () => {
  console.log(`Express server listening on *:${port}`);
});


// twitch messaging interface module
const tmi = require('tmi.js');

const client = new tmi.Client({
	options: { debug: false }, // set to false to get rid of console messages
	connection: {
		secure: true,
		reconnect: true
	},
	identity: {
		username: 'Chat_vs_Eric', // i don't think this matters?
		password: 'oauth token here'
	},
	channels: [ "imrosen" ]
	// channels: [ "Andrew_Chess" ]
});

// connect twitch client
client.connect();

// twitch client joins the streamer's chat
// client.on('join', () => {
// 	console.log(`Joined channel!`);
// });

client.on('message', (channel, tags, message, self) => {
	if (self) return;

	if (/^[A-z]$/.test(message) && !voters.includes(tags.username)) {
		let letter = message.toLowerCase();
		if (used.includes(letter)) return;

		if (votes[letter])
			votes[letter]++;
		else
			votes[letter] = 1;

		io.emit('votes', votes);

		voters.push(tags.username);

		console.log(`${tags['display-name']} voted for ${letter}.`);
	}
});