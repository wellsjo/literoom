// support connecting to localhost or internet
var USE_LOCALHOST = false;
var SOCKET = USE_LOCALHOST ? io.connect('http://localhost:4000') : io.connect('http://infinite-depths-4551.herokuapp.com/');
var TYPING = false;
var COLOR = localStorage.color ? localStorage.color : '#'+(Math.random()*0xFFFFFF<<0).toString(16);

// The name of the chatroom is based on the url 
var CHATROOM = document.URL.substring(document.URL.lastIndexOf('/') + 1); 
if (CHATROOM.indexOf('?') != -1) CHATROOM = CHATROOM.substring(0, CHATROOM.indexOf('?'));

$(document).ready(function() {
	
	if (localStorage.handle) {
		start_chatroom();
	}
	
	var join_room_button = $('#join_room_button');
	var send_message_button = $('#send_message');
	var message_input = $('#message');
	
	join_room_button.click(function() {
		var name = $('#user_handle').val();
		localStorage.handle = name;
		start_chatroom();
	});

	send_message_button.click(function() {
		var message = message_input.val().trim();
		if (message != '') {
			SOCKET.emit('send_message', message);
			message_input.val('');
		}
	});

	var stop_typing;
													   // TYPING FUNCTIONS
	message_input.keyup(function(e) {
		if ($('#message').val() === '') {              // BOX IS EMPTY
			remove_typing_status(localStorage.socket_id);
		}else if (e.keyCode === 8) {                   // BACKSPACE
			clearTimeout(stop_typing);
			remove_typing_status(localStorage.socket_id);
		}else if (e.keyCode === 13) {                  // ENTER
			clearTimeout(stop_typing);
			if (TYPING) {
				remove_typing_status(localStorage.socket_id);
			}
			send_message_button.click();
		}else{                                         // CATCH ALL
			if (!TYPING) {
				add_typing_status(localStorage.socket_id);
			}
			clearTimeout(stop_typing);
			stop_typing = setTimeout(function() {
				remove_typing_status(localStorage.socket_id);
			}, 1500);
		}
	}).keydown(function(e) {
		if (e.keyCode === 13) e.preventDefault();
	});

});

function start_chatroom() {

	SOCKET.emit('join_room', 
		{
			chatroom: CHATROOM, 
			handle: localStorage.handle, 
			color: COLOR, 
			old_socket_id: localStorage.socket_id
		});
	$('#join_room').hide();
	$('#container').show();
	$('#joined_as').html('<span style=\'color:gray\'>Handle:</span> ' 
		+ '<b>' +  localStorage.handle + '</b>');
	$('#room_header').html('<span style=\'color:gray;\'>Room:</span> '
		+ '<b>' + CHATROOM + '</b>');
	$('#user_color').html('<span style=\'color:gray;\'>Color:</span> '
		+ '<span style=\'color:' + COLOR + '\'>' + COLOR + '</span>'); // user's color
}

/* socket functions
 		sync_chatroom_members
		sync_socket_id
		broadcast_message
		user_typing
		user_stopped_typing
*/

SOCKET.on('sync_chatroom_members', function(members){
	if (localStorage.room !== JSON.stringify(members)) {
		$('#user_list').text('');
		for (var socket_id in members) {
			add_member(socket_id, members[socket_id].handle, members[socket_id].color);
		}
		localStorage.room = JSON.stringify(members);	
	}
});

SOCKET.on('joined_room', function(data) {
	localStorage.socket_id = data.socket_id;
	localStorage.color = data.color;
	add_message('you have joined the room \'' + CHATROOM + '\' as \'' + localStorage.handle + '\'', 'system');
});

SOCKET.on('broadcast_message', function(data) {
	var room = JSON.parse(localStorage.room);
	add_message('<b><span style=\'color:' + room[data.socket_id].color + '\'>' 
	+ room[data.socket_id].handle + '</span></b>' + ': ' + data.message, 'user');
});

SOCKET.on('user_typing', function(socket_id) {
	add_typing_status(socket_id);
});

SOCKET.on('user_stopped_typing', function(socket_id) {
	remove_typing_status(socket_id);
});

/* chatroom functions
 		add_member(socket_id, name, color)
		remove_member(socket_id, name)
		add_typing_status(socket_id)
		remove_typing_status(socket_id)
		add_message(message, type)
*/

function add_member(socket_id, name, color) {
	$('#user_list').append('<div data-socket_id=\'' + socket_id + '\' class=\'user_name\'>' 
	+ name + '<span class=\'user_typing\'>&nbsp;...</span></div>');
	$('.user_name[data-socket_id=' + socket_id + ']').css('color', color);
}

function add_message(message, type) {
	if (type == 'system') {
		$('#chatbox').append('<br/><span class=\'system_message\'>' + message + '</span>');		
	}else if (type == 'user') {
		message = linkify(message);
		$('#chatbox').append('<br/><span class=\'user_message\'>' + message + '</span>');		
	}
	$("#chatbox").scrollTop($("#chatbox")[0].scrollHeight);
}

function add_typing_status(socket_id) {
	if (!TYPING) {
		SOCKET.emit('started_typing', null);
		$('.user_name[data-socket_id=' + socket_id + ']').children('.user_typing').show();
		TYPING = true;
	}
}

function remove_typing_status(socket_id) {
	if (TYPING) {
		SOCKET.emit('stopped_typing', null);
		$('.user_name[data-socket_id=' + socket_id + ']').children('.user_typing').hide();
		TYPING = false;	
	}
}




