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
    socket.on('room_message', function(data) {
        var room_name = socket.room_data.room_name;
        if (data.action == "game_start")
            log().info("Game Start: %j", data);
        if (data.broadcast) {
                if (data.action == "game_start")
                    log().info("Game Start broadcast: %j", data);
            io.to(room_name).emit('room_message', data);
        }
        else {
            console.log("Send to owner! %j", data);
            if (owners[room_name]) {
                owners[room_name].emit('room_message', data);
            }
            else
                log().info("Or not :(!");
        }
    });
});

app.listen(port);
log().info('Server running ( port: ' + port + ' )');
