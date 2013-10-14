
/*
 * GET chatroom
 */

exports.create_room = function(req, res){

	var url = require('url');
	var url_parts = url.parse(req.url, true);

	// check to see if there was a theme parameter added
	var theme = 'light';
	var show_connected_users = 'true';
	var room_width = 450;
	var font_size = '15';

	if (url_parts.query) {
		if (url_parts.query.room_width) {
			if(parseInt(url_parts.query.room_width) < 450) {
				room_width = '450'
			}else if(parseInt(url_parts.query.room_width) > 1000) {
				room_width = '1000';
			}else{
				room_width = url_parts.query.room_width;
			}
		}

		if (url_parts.query.theme) theme = url_parts.query.theme;			
		if (url_parts.query.show_connected_users) show_connected_users = url_parts.query.show_connected_users;
		if (url_parts.query.font_size) font_size = url_parts.query.font_size
	}

	res.render('chatroom', 
	{ 
		title: req.params.chatroom,
		theme: theme,
		show_connected_users: show_connected_users,
		room_width: room_width, 
		font_size: font_size
	});
};
