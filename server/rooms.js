// ============================================================================
// This file contains user data
// ============================================================================
var log = require('./log');

var game_rooms = {};
function generateRoomId() {
    generateRoomId.count = ++generateRoomId.count || 1;
    return generateRoomId.count;
}

function createRoom(room_name, socket) {
	this.name = room_name;
	this.id = generateRoomId();
	this.owner = socket;
	this.user = [socket];

	socket.room = this;

	return this;
}

// NOTE(jose): I have absolutely no clue about JS synchronism so I extract this guys so we can later check it
function addClient(room, socket) {
	socket.room = room;
	room.user.push(socket);
}

function removeClient(room, socket) {
	socket.room = null;

	var index = room.user.indexOf(socket);
	if (index != -1) {
		room.user.splice(index, 1)[0];
		return;
	}

	// NOTE(jose): Something seems to be incorrect on this call
	log().warn('room does not contain user: ' + socket.user.id);
}

function getRoomUsers(room) {
	var room_client_count = room.user.length;
	var room_clients = [];
	for (var i = 0; i < room_client_count; ++i) {
		room_clients.push(room.user[i].user);
	}
	return room_clients;
}

function getRoomOwner(room) {
	return room.owner.user;
}

module.exports = {
	get: function() {
		return game_rooms;
	},

	get: function(room_id) {
		return game_rooms[room_id];
	},

	create: function (io, socket, room_name) {

		var new_room = createRoom(room_name, socket);
		game_rooms[new_room.id] = new_room;
		
		socket.join(new_room.id);

		log().info('user ( ' + socket.user.id + ' ) creating room ( ' + new_room.id + ' )');
	},

	join: function (io, socket, room) {
		log().info('user ( ' + socket.user.id + ' ) joining room ( ' + room.id + ' ) ');

		addClient(room, socket);
		
		socket.join(room.id);
		io.to(room.id).emit('room_clients', {owner: getRoomOwner(room), users: getRoomUsers(room)});
	},

	leave: function (io, socket) {
		log().info('user ( ' + socket.user.id + ' ) leaving room ( ' + socket.room.id + ' )');

		var room = socket.room;
		removeClient(room, socket);

		if (room.owner == socket && room.user.length > 0) {
			room.owner = room.user[0];
			log().info('user ( ' + room.owner.user.id + ' ) new owner of room ( ' + room.id + ' )');
		}

		socket.leave(room.id);
		io.to(room.id).emit('room_clients', {owner: getRoomOwner(room), users: getRoomUsers(room)});
	},

	disconnect: function(io, socket) {
		log().info('user ( ' + socket.user.id + ' )  left');

		var room = this.get(socket.room.id);
		if (room != undefined) {
			this.leave(io, socket);
		}
	}
};
