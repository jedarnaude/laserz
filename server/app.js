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
var seed = Math.floor((Math.random() * 1000000));
io.sockets.on('connection', function(socket) {
    console.log("new user " + players);
    socket.join('test room');
    socket.emit('game setup', { seed: seed.toString(), player_id: players++ });

    if (players == 2) {
        io.sockets.emit('game start', {});
    }

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
