var ENGINE = { };

ENGINE.Game = {

  onServerJoin: function(data) {
    this.user = data;
    console.log("server_join");
    console.dir(data);
  },

  onRoomJoin: function(data) {
    // TODO(jose): Here goes room configs but not clients
  },

  onRoomClients: function(data) {
    // TODO(jose): room name and id are known before joining, otherwise its a different protocol
    // right now its hardcoded.
    this.room = {name: "test room", id: 1};
    this.room.users = data.users;
    this.room.owner = data.owner;
    console.dir(this.room);

    this.text.innerHTML = 
      "<p>ROOM: " + this.room.name + " ( " + this.room.id + " )</p>" +
      "<p>OWNER: " + this.room.owner.name + " ( " + this.room.owner.id + " )</p>";
    var clients_count = data.users.length;
    for (var i = 0; i < clients_count; ++i) {
      this.text.innerHTML += 
        "<p>CLIENT: " + data.users[i].name + " ( " + data.users[i].id + " )</p>";
    }
    // TODO(jose): room owner can start a game rest cannot;

    // if (this.isRoomOwner()) {
    //   // hardcode
    //   if (data.room_clients.length == 2) {
    //     var game_players = [ data.room_clients[0], data.room_clients[1] ];
    //     console.log("I am king! shall the game start");
    //     this.sendRoomMessage("game_start", true, { seed: Math.floor((Math.random() * 1000000)), players: game_players })
    //   }
  },  

  onRoomLeave: function(data) {
    console.log("Room leave: " + data.room_name + ", owner=" + data.room_owner);
    this.in_room = false;
  },

  onRoomMessage: function(data) {
    console.log("OnRoomMessage! %j", data);
    switch (data.action) {
      case "game_inputs":
        // inputs
        this.player_inputs[data.player_id] = data.inputs;
        break;
      case "game_start":
        // NOTE(jordi): hardcoded game_playerid for 2 players
        console.log("game start!");
        this.player_id = (data.players[0].client_id == this.client_id) ? 0 : 1;
        this.game.onRoomMessage(data);
        break;
      case "game_update":
        this.game.onRoomMessage(data);
        break;
    }
  },
  
  sendRoomMessage: function(action, broadcast, data) {
    data.action = action;
    data.broadcast = broadcast;
    this.socket.emit("room_message", data);
  },

  isRoomOwner: function() {
    return this.room_data.room_owner == this.room_data.client_id;
  },

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
    this.user = undefined;
    this.room = undefined;
    this.socket = io.connect('http://localhost:3000');
    this.socket.on('error', function() { console.error(arguments) });
    this.socket.on('message', function() { console.log(arguments) });
    this.socket.on('server_join', this.onServerJoin.bind(this));
    this.socket.on('room_join', this.onRoomJoin.bind(this));
    this.socket.on('room_clients', this.onRoomClients.bind(this));
    this.socket.on('room_leave', this.onRoomLeave.bind(this));
    this.socket.on('room_message', this.onRoomMessage.bind(this));

    // game start message
    var text = document.createElement('div');
    text.innerHTML = "Press Enter to start with keyboard or Gamepad button A to use a Gamepad";
    text.style.position = 'absolute';
    text.style.top = 50 + 'px';
    text.style.left = 50 + 'px';
    text.style.color = 'white';
    text.style.width = 500;
    text.style.height = 50;
    document.body.appendChild(text);
    this.text = text;

    // inputs
    this.inputs = [];
    this.inputs[0] = new InputKeyboard(0);
    this.inputs[1] = new InputKeyboard(1);
    this.inputs[2] = new InputGamepad(0);
    this.inputs[3] = new InputGamepad(1);

    // player data
    this.player_id = 0;
    this.player_inputs = [];

    // game instance
    this.game = new gameCreate(this.scene, this.socket);
  },

  resize: function() {
    console.log("Game Resize");
  },

  step: function(dt) {
    // run inputs
    this.inputs[0].update(this.app.keyboard);
    this.inputs[1].update(this.app.keyboard);
    this.inputs[2].update(this.app.gamepads);
    this.inputs[3].update(this.app.gamepads);

    if (!this.in_room) {
      for (var i = 0; i < 4; i++) {
        if (this.inputs[i].buttons_pressed) {
          console.log("Using input device: " + i);
          this.player_input = i;
          // send room join
          this.socket.emit("room_join", { id: 1 });
          this.text.innerHTML = "Waiting...";
        }
      }
    }
    else {
      // send inputs to server
      this.sendRoomMessage("game_inputs", false, { player_id: this.player_id, inputs: this.inputs[this.player_input] })
      // game
      if (this.isRoomOwner()) {
        this.sendRoomMessage("game_update", true, { delta: dt, inputs: this.player_inputs });
      }
    }
  },

  render: function() {
    // render
    this.app.renderer.render(this.scene, this.camera);
  },

};
