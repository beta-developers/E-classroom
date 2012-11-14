/*This file is part of E-Classroom.

    E-Classroom is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    E-Classroom is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with E-Classroom.  If not, see <http://www.gnu.org/licenses/>.

*/

var express = require('express');
var app = require('express').createServer();
var io = require('socket.io').listen(app);

app.listen(8082);
app.use(express.static(__dirname + '/videos')); /*tell the server that we will be using the static resources from this folder */
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/videos/index.html');	
});

// usernames which are currently connected to the chat
var usernames = {};

var x=new Array();
var y=new Array();

io.sockets.on('connection', function (socket) {

	// when the client emits 'send_mousedown', this listens and executes
	socket.on('send_mousedown', function (a,b,colorb) {
		// we tell the client to execute 'update_mousedown'

		x[socket.username]=a;
		y[socket.username]=b;
		socket.broadcast.emit('update_mousedown',a,b,colorb);
	});

	socket.on('send_mousedrag', function (a,b,colorb) {
		// we tell the client to execute 'update_mousedrag'
		socket.broadcast.emit('update_mousedrag',a,b,x[socket.username],y[socket.username],colorb);
		x[socket.username]=a;
		y[socket.username]=b;
	});

	socket.on('send_chat', function (data) {
		// we tell the client to execute 'update_chat'
		io.sockets.emit('update_chat', socket.username, data);
	});

	socket.on('send_video',function(videoTime){
		io.sockets.emit('update_video',videoTime)
	});

	socket.on('pausing',function(){
		io.sockets.emit('pause');			
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		x[socket.username]=-1;
		y[socket.username]=-1; 
		
		// we store the username in the socket session for this client
		socket.username = username;

		// add the client's username to the global list
		usernames[username]=username;

		// echo to client they've connected
		socket.emit('update_chat', '[', 'you have connected:]');

		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('update_chat', 'SERVER', username + ' has connected');

		// update the list of users in chat, client-side
		io.sockets.emit('update_users', usernames);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){

		// remove the username from global usernames list
		delete usernames[socket.username];

		// update list of users in chat, client-side
		io.sockets.emit('update_users', usernames);

		// echo globally that this client has left
		socket.broadcast.emit('update_chat', 'SERVER', socket.username + ' has disconnected');
	});

});
