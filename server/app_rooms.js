var http = require('http'),
    fs = require('fs'),
    index = fs.readFileSync(__dirname + '/../index.html');

// Send index.html to all requests
var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);

// TODO(jose): have a property information sent back and forth
// TODO(jose): rooms are needed for multiple simultaneous games
// TODO(jose): extract protocols to general config file for server and client

var client_id = 1;

io.sockets.on('connection', function(socket) {
    socket.client_id = client_id++;
    socket.room_data = { client_name: 0, room_name: 0 };
    console.log("Client connected: " + socket.client_id);

    // send client id
    socket.emit('server_join', { client_id: socket.client_id });

    // disconnect
    socket.on('disconnect', function() {
        if (socket.room_data.room_name != 0)
            onRoomLeave(socket.room_data.room_name);
        console.log('Client disconnected: ' + socket.client_id);
    });

    // client joins room
    socket.on('room_join', function(data) {
        onRoomJoin(data);
    });

    // client leaves room
    socket.on('room_leave', function(data) {
        onRoomLeave();
    });    

    // Game in progress
    socket.on('room_message', function(data) {
        io.to(socket.room_data.room_name).emit('room_message', data);
    });

    function findClientsSocketByRoomId(roomId) {
        var res = [];
        var room = io.sockets.adapter.rooms[roomId];
        if (room) {
            for (var id in room)
                res.push(io.sockets.adapter.nsp.connected[id]);
        }
        return res;
    }

    function onRoomJoin(room_data) {
        if (findClientsSocketByRoomId(room_data.room_name).length < 2)
        {
            // save room data
            socket.room_data = room_data;
            // add socket to room
            socket.join(socket.room_data.room_name);
            // get connected clients to room and broadcast room join message to all
            var clients = findClientsSocketByRoomId(socket.room_data.room_name);
            var room_clients = [];
            for (var client in clients)
                room_clients.push(client.room_data);
            console.log("Client " + socket.client_id + ": Room join '" + socket.room_data.room_name + "' (clients=" + clients.length + ", owner=" + clients[0].client_id + ")");            
            // room_data: room_data of client that joined room
            // room_clients: list of clients in this room
            // room_owner: client_id of the room owner (will be the server)
            io.to(socket.room_data.room_name).emit('room_join', { room_data: socket.room_data, room_clients: room_clients, room_owner: clients[0].client_id });
        }
        else
            console.log("Client " + socket.client_id + ": Room join '" + room_data.room_name + "' (full)");        
    }

    function onRoomLeave() {
        // remove socket from room
        socket.leave(socket.room_data.room_name);
        // get connected clients to room and broadcast room leave message to all
        if (findClientsSocketByRoomId(socket.room_data.room_name).length > 0)
        {
            var clients = findClientsSocketByRoomId(socket.room_data.room_name);
            var room_clients = [];
            for (var client in clients)
                room_clients.push(client.room_data);            
            console.log("Client " + socket.client_id + ": Room leave '" + socket.room_data.room_name + "' (clients=" + clients.length + ", owner=" + clients[0].client_id + ")");
            // room_data: room_data of client that left room
            // room_clients: list of clients in this room
            // room_owner: client_id of the room owner (will be the server)
            io.to(socket.room_data.room_name).emit('room_leave', { room_data: socket.room_data, room_clients: room_clients, room_owner: clients[0].client_id });
        }
        else
            console.log("Client " + socket.client_id + ": Room leave '" + socket.room_data.room_name + "' (empty)");
        // clear room data
        socket.room_data.room_name = 0;
    }
});

app.listen(3000);
console.log("---------------------------------------");
console.log("Server running on http://localhost:3000");
console.log("---------------------------------------");