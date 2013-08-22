var express = require('express'), 
app = express(),
http = require('http'),
server = http.createServer(app),
io = require('socket.io').listen(server),
routes = require('./routes'), 
chatroom = require('./routes/chatroom'),
path = require('path');

var check = require('validator').check,
    sanitize = require('validator').sanitize;

io.configure(function () {
	io.set("transports", ["xhr-polling"]);
	io.set("polling duration", 10);
});

var room_data = []; // an array containing all the room data

io.sockets.on('connection', function (socket) {

	socket.on('join_room', function(data) {
		socket._handle = data.handle;
		socket._room = data.chatroom;
		socket.join(data.chatroom);
		if (!room_data[data.chatroom]) room_data[data.chatroom] = {};
		room_data[data.chatroom][socket.id] = 
		{
			handle: socket._handle, 
			color: data.color
		};
		delete room_data[socket._room][data.old_socket_id];	
		io.sockets.in(socket._room).emit('sync_chatroom_members', room_data[socket._room]);
		socket.broadcast.to(socket._room).emit('new_member', data.handle);
		socket.emit('joined_room', {socket_id: socket.id, color: data.color});
	});
	
	socket.on('send_message', function (message) {
		message = sanitize(message).xss().trim();
		io.sockets.in(socket._room).emit('broadcast_message',  {message: message, socket_id: socket.id});
	});
	
	socket.on('typing', function() {
		socket.broadcast.to(socket._room).emit('user_typing', socket.id);
	});
	
	socket.on('stopped_typing', function() {
		socket.broadcast.to(socket._room).emit('user_stopped_typing', socket.id);
	});
	
	socket.on('disconnect', function() {
		socket.leave(socket._room);
		if (room_data[socket._room] && room_data[socket._room][socket.id]) delete room_data[socket._room][socket.id];
		io.sockets.in(socket._room).emit('sync_chatroom_members', room_data[socket._room]);
	});
});

app.configure(function(){
	app.set('port', process.env.PORT || 4000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.get('/', routes.index);
app.get('/r/:chatroom', chatroom.create_room);

server.listen(app.get('port'), function(){
	console.log("Server listening on port " + app.get('port'));
});
