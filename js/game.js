var ENGINE = { };

var GGame;

ENGINE.Game = {

  create: function() {

    console.log("------------------------------------")
    console.log("Multiplayer game")
    console.log("------------------------------------")

    GGame = this;

    // NOTE(jordi): move all this to multiplayer.js? or world.js or something {
      // Scene
      this.scene = new THREE.Scene();
      // camera
      this.camera = new THREE.PerspectiveCamera( 25, 0, 0.1, 100000 );
      this.camera.aspect = this.app.width / this.app.height;
      this.camera.position.set(0,0,2300);
      this.camera.up = new THREE.Vector3(0,1,0);
      this.camera.lookAt(new THREE.Vector3(0,0,0));    
      this.camera.updateProjectionMatrix();
      // Lights
      this.scene.add( new THREE.AmbientLight( 0x202020 ) );
      // Directional light
      var light = new THREE.DirectionalLight( 0xA0A0A0, 1 );
      light.position.set( -10, 10, 50 ).normalize();
      this.scene.add( light );
      // ground
      var ground = new THREE.Mesh(new THREE.BoxGeometry( 1000,1000,1, 10,10,1 ), new THREE.MeshPhongMaterial( { color: 0xFFFFFF, specular: 0, shininess: 1, shading: THREE.SmoothShading, map: THREE.ImageUtils.loadTexture('assets/background.jpg') } ));
      this.scene.add(ground);
    // }

    // network
    this.in_room = false;
    this.room_data = { client_id: 0, players: [], room_name: 0, room_owner: 0 };
    this.socket = io.connect('http://localhost:3000');
    this.socket.on('error', function() { console.error(arguments) });
    this.socket.on('message', function() { console.log(arguments) });
    this.socket.on('server_join', function(data) { GGame.onServerJoin(data); });
    this.socket.on('room_join', function(data) { GGame.onRoomJoin(data); });
    this.socket.on('room_leave', function(data) { GGame.onRoomLeave(data); });
    this.socket.on('room_message', function(data) { GGame.onMessage(data); });

    // game start message
    var text = document.createElement('div');
    text.innerHTML = "Press a Key to start with keyboard or Gamepad button to use Gamepad";
    text.style.position = 'absolute';
    text.style.top = 50 + 'px';
    text.style.left = 50 + 'px';
    text.style.color = 'white';
    text.style.width = 500;
    text.style.height = 50;
    document.body.appendChild(text);

    // gamepad lib
    gamepadSupport.init();

    // game
    this.game = new gameCreate(this.scene, this.socket);
  },

  resize: function() {
    console.log("Game Resize");
  },

  step: function(dt) {
    // game
    if (this.isRoomOwner())
      this.game.gameRunServer(dt);
  },

  render: function() {
    // render
    this.app.renderer.render(this.scene, this.camera);
  },

  onServerJoin: function(data) {
    this.room_data.client_id = data.client_id;
    this.game.client_id = data.client_id;
    console.log("Server join: client_id=" + this.room_data.client_id);

    // send room join (we should joing after selecting a controller)
    var GAME_TEST_ROOM = "ROOM_TEST_1";
    this.socket.emit("room_join", { room_name: GAME_TEST_ROOM, client_name: "Pepekike", client_id: this.room_data.client_id });
  },

  onRoomJoin: function(data) {
    this.in_room = true;
    this.room_data.room_clients = data.room_clients;
    this.room_data.room_owner = data.room_owner;
    console.log("Room join: '" + data.room_data.room_name + ", name='" + data.room_data.client_name + "', client=" + data.room_data.client_id + "', owner=" + data.room_owner);
    console.log("Room clients: " + data.room_clients.length);
    if (this.isRoomOwner()) {
      // hardcode
      if (data.room_clients.length == 2) {
        var game_players = [ data.room_clients[0], data.room_clients[1] ];
        console.log("I am king! shall the game start");
        this.game.sendMessage("game_start", { seed: Math.floor((Math.random() * 1000000)), players: game_players })
      }
    }
  },

  onRoomLeave: function(data) {
    console.log("Room leave: " + data.room_name + ", owner=" + data.room_owner);
    this.in_room = false;
  },

  onMessage: function(data) {
    this.game.onMessage(data);
  },

  isRoomOwner: function() {
    return this.room_data.room_owner == this.room_data.client_id;
  },

};
