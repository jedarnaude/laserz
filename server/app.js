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
var GAME_WAITING = 0;
var GAME_INPROGRESS = 1;
var GAME_PAUSED = 2;
var GAME_RESUME = 3;
var GAME_OVER = 4;

var game = {
    seed: Math.floor((Math.random() * 1000000)),
    state: GAME_WAITING,
}

io.sockets.on('connection', function(socket) {
    console.log("new user");
    socket.join('test room');
    var players = io.sockets.adapter.rooms['test room'];
    var players_count = (typeof players !== 'undefined') ? Object.keys(players).length : 0;
    console.log("users in game " + players_count);

    socket.emit('game setup', { seed: game.seed, player_id: players_count-1 });

    // Game waiting
    if (players_count == 2) {
        if (game.state == GAME_WAITING) {
            game.state = GAME_INPROGRESS;
            io.sockets.emit('game status', { state: game.state });
            console.log("starting game in room");
        } else if (game.state == GAME_PAUSED) {
            game.state = GAME_RESUME;
            io.sockets.to('test room').emit('game status', { state: game.state });
            console.log("resuming game in room");
        }
    }

    // Game in progress
    socket.on('key down', function(data) {
        socket.broadcast.to('test room').emit('key down', data);
    });
    socket.on('key up', function(data) {
        socket.broadcast.to('test room').emit('key up', data);
    });

    // Game Over
    socket.on('game over', function(data) {
        game.state = GAME_OVER;
        socket.broadcast.to('test room').emit('game status', { state: game.state });
        console.log("game over in room");
    });
    socket.on('game rematch', function(data) {
        console.log("rematch in room");
        game.state = GAME_WAITING;
        socket.broadcast.to('test room').emit('game status', { state: game.state });
        game.state = GAME_INPROGRESS;
        socket.broadcast.to('test room').emit('game status', { state: game.state });
    });

    // Game problems
    socket.on('disconnect', function() {
        if (game.state == GAME_INPROGRESS) {
            game.state = GAME_PAUSED;
            io.sockets.emit('game status', { state: game.state });
            console.log("pause in room");
        }

        console.log('disconnected user');
    });
});

app.listen(3000);
