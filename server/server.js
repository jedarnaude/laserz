var http = require('http'),
    fs = require('fs'),
    index = fs.readFileSync(__dirname + '/../index.html');

var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);
var port = 3000;

// TODO(jose): extract protocols to general config file for server and client
var clients = require('./clients');
var rooms = require('./rooms');
var log = require('minilog');

// Socket impacts our server
io.sockets.on('connection', function(socket) {

    // Welcome our client
    // TODO(jose): protocol for clients
    // NOTE(jose): Are we fully sharing structs server/client?
    socket.user = clients.create('unknown player');
    socket.emit('server_join', socket.user);

    // NOTE(jose): Temporal logic for first iterations
    var test_room = rooms.get(1);
    if (test_room == undefined) {
        rooms.create(io, socket, 'test room');
    }

    // client disconnect
    socket.on('disconnect', function() {
        rooms.disconnect(io, socket);
    });

    // client joins room
    socket.on('room_join', function(data) {
        if (socket.room == undefined) {
            rooms.join(io, socket, rooms.get(data.id));
        }    
    });

    // client leaves room
    socket.on('room_leave', function(data) {
        rooms.leave(io, socket);
    });    

    // Game in progress
    socket.on('room_message', function(action, data) {
        var room = socket.room;
        switch(action) {
        case 'game_start':
            io.to(room.id).emit('room_message', action, data);
            break;
        case 'game_inputs':
            io.to(room.id).emit('room_message', action, data);
            break;            
        case 'game_update':
            // TODO(jose): Simulate with inputs
            io.to(room.id).emit('room_message', action, data);
            break;
        }
        // log().debug('user ( ' + socket.user.id + ' ) sent message ( ' + action + ' ) to room ( ' + room.id + ' )');
    });
});

app.listen(port);
log().info('Server running ( port: ' + port + ' )');
