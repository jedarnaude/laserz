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
var clients = [];
var owners = [];

io.sockets.on('connection', function(socket) {
    socket.client_id = client_id++;
    socket.room_data = { client_name: 0, room_name: 0 };
    console.log("Client connected: " + socket.client_id);

    // send client id
    socket.emit('server_join', { client_id: socket.client_id });

    // disconnect
    socket.on('disconnect', function() {
        var room_name = socket.room_data.room_name;
        if (room_name != 0)
            onRoomLeave(room_name);
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
        var room_name = socket.room_data.room_name;
        if (data.action == "game_start")
            console.log("Game Start: %j", data);
        if (data.broadcast) {
                if (data.action == "game_start")
                    console.log("Game Start broadcast: %j", data);
            io.to(room_name).emit('room_message', data);
        }
        else {
            console.log("Send to owner! %j", data);
            if (owners[room_name]) {
                owners[room_name].emit('room_message', data);
            }
            else
                console.log("Or not :(!");
        }
    });

    function onRoomJoin(room_data) {
        var room_name = socket.room_data.room_name;
        if (!clients[room_name])
            clients[room_name] = [];
        if (clients[room_name].length < 2)
        {
            // save room data
            socket.room_data = room_data;
            // add socket to room
            socket.join(room_name);
            clients[room_name].push(socket);
            owners[room_name] = clients[room_name][0];
            // get connected clients to room and broadcast room join message to all
            var room_clients = [];
            for (var i = 0; i < clients[room_name].length; i++)
            {
                console.log("Client Room Data %d: %j", i, clients[room_name][i].room_data);
                room_clients.push(clients[room_name][i].room_data);
            }
            console.log("Client " + socket.client_id + ": Room join '" + room_name + "' (clients=" + clients[room_name].length + ", owner=" + owners[room_name].client_id + ")");            
            console.log("Room owner: %j", owners[room_name]);
            // room_data: room_data of client that joined room
            // room_clients: list of clients in this room
            // room_owner: client_id of the room owner (will be the server)
            io.to(room_name).emit('room_join', { room_data: socket.room_data, room_clients: room_clients, room_owner: owners[room_name].client_id });
        }
        else
            console.log("Client " + socket.client_id + ": Room join '" + room_data.room_name + "' (full)");        
    }

    function onRoomLeave() {
        // remove socket from room
        var room_name = socket.room_data.room_name;
        socket.leave(room_name);
        socket.room_data.room_name = 0;
        var i = clients[room_name].indexOf(socket);
        if (i != -1)
            clients[room_name].splice(i, 1);
        owners[room_name] = clients[room_name][0];

        // get connected clients to room and broadcast room leave message to all
        if (clients[room_name].length > 0)
        {
            var room_clients = [];
            for (var i = 0; i < clients[room_name].length; i++)
                room_clients.push(clients[room_name][i].room_data);            
            console.log("Client " + socket.client_id + ": Room leave '" + room_name + "' (clients=" + clients[room_name].length + ", owner=" + owners[room_name].client_id + ")");
            // room_data: room_data of client that left room
            // room_clients: list of clients in this room
            // room_owner: client_id of the room owner (will be the server)
            io.to(room_name).emit('room_leave', { room_data: socket.room_data, room_clients: room_clients, room_owner: owners[room_name].client_id });
        }
        else
            console.log("Client " + socket.client_id + ": Room leave '" + room_name + "' (empty)");
    }
});

app.listen(3000);
console.log("---------------------------------------");
console.log("Server running on http://localhost:3000");
console.log("---------------------------------------");