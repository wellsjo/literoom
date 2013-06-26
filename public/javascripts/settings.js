$(document).ready(function() {

	if (chatroom_theme == 'dark') {
		$('body').css('color', 'white');
		$('#message').css('background-color', 'black');
		$('#message').css('color', 'white');
		$('#chatbox').css('background-color', 'black');
		$('#users').css('background-color', 'black');
		$('#room').css('background-color', 'black');
		$('.user_typing').css('color', 'white');
	}
	
	if (show_connected_users == 'false') {
		$('#users').hide();
	}
	
	$('#container, #join_room').css('width', room_width);
	$('#room').css('width', room_width - 162);
	$('#body').css('font-size', font_size + 'px');
});