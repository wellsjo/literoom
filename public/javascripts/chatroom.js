function ready() {
	// support connecting to localhost or internet
	var USE_LOCALHOST = true;
	var SOCKET = USE_LOCALHOST ? io.connect('http://localhost:4000') : io.connect('http://infinite-depths-4551.herokuapp.com/');
	var COLOR = localStorage.color ? localStorage.color : '#'+(Math.random()*0xFFFFFF<<0).toString(16);

	// The name of the chatroom is based on the url 
	var CHATROOM = document.URL.substring(document.URL.lastIndexOf('/') + 1); 
	if (CHATROOM.indexOf('?') != -1) CHATROOM = CHATROOM.substring(0, CHATROOM.indexOf('?'));
	if (localStorage.handle) {
		start_chatroom();
	}

	var chatroom_body = document.getElementById('literoomjs');
	var users = document.getElementById('users');
	var user_list = document.getElementById('user_list');
	var room = document.getElementById('room');
	var join_room_button = document.getElementById('send_message');
	var send_message_button = document.getElementById('send_message');
	var message_input = document.getElementById('message');
	var chatbox = document.getElementById('chatbox');

	DefineCSS();

	join_room_button.onclick = function() {
		var name = document.getElementById('user_handle').value();
		localStorage.handle = name;
		start_chatroom();
	};

	send_message_button.onclick = function() {
		var message = message_input.value.trim();
		if (message != '') {
			SOCKET.emit('send_message', message);
			message_input.value = '';
		}
	};

	message_input.onkeyup = function(e) {
		if (e.keyCode === 13) {
			send_message_button.click();
		}
	}
	
	message_input.keydown = function(e) {
		if (e.keyCode === 13) e.preventDefault();
	};
	
	function start_chatroom() {

		SOCKET.emit('join_room', 
			{
				chatroom: CHATROOM, 
				handle: localStorage.handle, 
				color: COLOR, 
				old_socket_id: localStorage.socket_id
			});
		
		// hide front page and show chatroom
		document.getElementById('join_room').style.display = 'none';
		document.getElementById('container').style.display = 'block';
		document.getElementById('joined_as').innerHTML = '<span style=\'color:gray\'>Handle:</span> ' 
			+ '<b>' +  localStorage.handle + '</b>';
		document.getElementById('room_header').innerHTML = '<span style=\'color:gray;\'>Room:</span> '
		 	+ '<b>' + CHATROOM + '</b>';
		document.getElementById('user_color').innerHTML = '<span style=\'color:gray;\'>Color:</span> '
			+ '<span style=\'color:' + COLOR + '\'>' + COLOR + '</span>';
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
			user_list.innerHTML = '';
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
		user_list.innerHTML += '<div data-socket_id=\'' + socket_id 
			+ '\' class=\'user_name\' style="color:'+ color +'">' + name 
			+ '<span class=\'user_typing\'>&nbsp;...</span></div>';
	}

	function add_message(message, type) {
		if (type == 'system') {
			chatbox.innerHTML += '<br/><span class=\'system_message\'>' + message + '</span>';		
		}else if (type == 'user') {
			message = linkify(message);
			chatbox.innerHTML += '<br/><span class=\'user_message\'>' + message + '</span>';
		}
		chatbox.scrollTop = chatbox.scrollHeight;
	}

	function DefineCSS() {
		if (literoomjs.chatroom_theme === 'dark') {
			chatroom_body.style.color = 'white';
			message_input.style['background-color'] = 'black';
			message_input.style.color = 'white';
			chatbox.style['background-color'] = 'black';
			users.style['background-color'] = 'black';
			room.style['background-color'] = 'black';
		}
		
		if (literoomjs.show_connected_users === 'false') {
			users.style.display = 'none';
		}
		
		document.getElementById('container').style.width = literoomjs.room_width;
		document.getElementById('join_room').style.width = literoomjs.room_width;

		var room_width = (literoomjs.room_width - 100) + 'px';
		room.style.width = room_width;
		chatroom_body.style['font-size'] = literoomjs.font_size + 'px';
	}
}

function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}
