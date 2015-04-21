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
var players = 0;
io.sockets.on('connection', function(socket) {
    console.log("new user");
    socket.join('test room');
    socket.emit('player id', { player_id: players++ });

    socket.on('key down', function(data) {
        socket.broadcast.to('test room').emit('key down', data);
    });
    socket.on('key up', function(data) {
        socket.broadcast.to('test room').emit('key up', data);
    });
    socket.on('disconnect', function(){ 
        players--;
        console.log('disconnected user');
    });
});

app.listen(3000);
