var literoomjs = (function(lrjs) {

	var chatroom_body, users, user_list, room, join_room_button, 
		send_message_button, message_input, chatbox;

	var colors = ["#00ffff", "#f5f5dc", "#0000ff", "#00ffff", "#F0E68C", "#9932cc", "#e9967a", "#9400d3", "#ff00ff", "#ffd700", "#008000", "#add8e6", "#90ee90", "#ff00ff", "#808000", "#ffa500", "#ffc0cb", "#ff0000"];

	var settings = {
		host: {
			development: 'http://localhost:4000',
			production: 'http://your-server.com/'
		},
		chatroom_name: (function() {
			var name = document.URL.substring(document.URL.lastIndexOf('/') + 1);
			if (name.indexOf('?') != -1) name = name.substring(0, name.indexOf('?'));
			return name;
		}()),
		color: (function(){
			if (localStorage.getItem('lrjs-color')) {
				return localStorage.getItem('lrjs-color');
			}else{
				var new_color = colors[Math.floor(colors.length * Math.random())];
				localStorage.setItem('lrjs-color', new_color);
				return new_color;
			}
		}())
	};

	var socket = io.connect(settings.host.development);

	socket.on('sync_chatroom_members', function(members){
		if (localStorage.getItem('lrjs-room') !== JSON.stringify(members)) {
			user_list.innerHTML = '';
			for (var socket_id in members) {
				add_member(socket_id, members[socket_id].handle, members[socket_id].color);
			}
			localStorage.setItem('lrjs-room', JSON.stringify(members));	
		}
	});

	socket.on('joined_room', function(data) {
		localStorage.setItem('lrjs-socket_id', data.socket_id);
		localStorage.setItem('lrjs-color', data.color);
		add_message('You have joined the room \'' + settings.chatroom_name + '\' as \'' + localStorage.getItem('lrjs-handle') + '\'', 'system');
	});

	socket.on('broadcast_message', function(data) {
		var room = JSON.parse(localStorage.getItem('lrjs-room'));
		add_message('<b><span style=\'color:' + room[data.socket_id].color + '\'>' 
		+ room[data.socket_id].handle + '</span></b>' + ': ' + data.message, 'user');
	});

	socket.on('user_typing', function(socket_id) {
		add_typing_status(socket_id);
	});

	socket.on('user_stopped_typing', function(socket_id) {
		remove_typing_status(socket_id);
	});

	function startChatroom() {
		socket.emit('join_room', {
			chatroom: settings.chatroom_name, 
			handle: localStorage.getItem('lrjs-handle'), 
			color: settings.color, 
			old_socket_id: localStorage.getItem('lrjs-socket_id')
		});
		
		// hide front page and show chatroom
		document.getElementById('join_room').style.display = 'none';
		document.getElementById('container').style.display = 'block';
		document.getElementById('joined_as').innerHTML = '<span style=\'color:gray\'>Handle:</span> ' 
			+ '<b>' +  localStorage.getItem('lrjs-handle') + '</b>';
		document.getElementById('room_header').innerHTML = '<span style=\'color:gray;\'>Room:</span> '
		 	+ '<b>' + settings.chatroom_name + '</b>';
		document.getElementById('user_color').innerHTML = '<span style=\'color:gray;\'>Color:</span> '
			+ '<span style=\'color:' + settings.color + '\'>' + settings.color + '</span>';
	}

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

	// makes links clickable in messages
	function linkify(inputText) {
	    var replacedText, replacePattern1, replacePattern2, replacePattern3;

	    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
	    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

	    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
	    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

	    replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
	    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

	    return replacedText;
	}

	return ({	
		load: function() {
			join_room_button = document.getElementById('join_room_button');
			chatroom_body = document.getElementById('literoomjs');
			users = document.getElementById('users');
			user_list = document.getElementById('user_list');
			room = document.getElementById('room');
			send_message_button = document.getElementById('send_message');
			message_input = document.getElementById('message');
			chatbox = document.getElementById('chatbox');

			if (lrjs.chatroom_theme === 'dark') {
				chatroom_body.style.color = 'white';
				message_input.style['background-color'] = 'black';
				message_input.style.color = 'white';
				chatbox.style['background-color'] = 'black';
				users.style['background-color'] = 'black';
				room.style['background-color'] = 'black';
			}
			
			if (lrjs.show_connected_users === 'false') {
				users.style.display = 'none';
			}
			
			document.getElementById('container').style.width = lrjs.room_width;
			document.getElementById('join_room').style.width = lrjs.room_width;

			var room_width = (lrjs.room_width - 100) + 'px';
			room.style.width = room_width;
			chatroom_body.style['font-size'] = lrjs.font_size + 'px';

			join_room_button.onclick = function() {
				var name = document.getElementById('user_handle').value;
				localStorage.setItem('lrjs-handle', name);
				startChatroom();
			};

			send_message_button.onclick = function() {
				var message = message_input.value.trim();
				if (message != '') {
					socket.emit('send_message', message);
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

			if (localStorage.getItem('lrjs-handle')) {
				startChatroom();
			}			
		}
	});
}(literoomjs));
