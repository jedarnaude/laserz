var ENGINE = { };

function newGameStart() {
  ENGINE.Game.sendRoomMessage("game_start", { seed: Math.floor((Math.random() * 1000000)) });
}

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

    // NOTE(jose): temporary button to make iterations fast
    var play_button = document.getElementById("play");
    play_button.removeEventListener("click", newGameStart);
    play_button.addEventListener("click", newGameStart);
  },  

  onRoomLeave: function(data) {
    console.log("Room leave: " + data.room_name + ", owner=" + data.room_owner);
    this.in_room = false;
  },

  onRoomMessage: function(action, data) {
    switch (action) {
      case "game_start":
        this.game.onRoomMessage(action, data);
        break;
      case "game_inputs":
        // inputs
        this.player_inputs[data.player_index] = data;
        break;
      case "game_update":
        this.game.onRoomMessage(action, data);
        break;
    }
  },
  
  sendRoomMessage: function(action, data) {
    this.socket.emit("room_message", action, data);
  },

  isRoomOwner: function() {
    return this.room.owner.id == this.user.id;
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

    if (this.room == undefined) {
      // NOTE(jose): remove this step condition, it should just wait until game starts
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
      this.sendRoomMessage("game_inputs", this.inputs[this.player_input] );
      if (this.isRoomOwner())
        this.sendRoomMessage("game_update", { delta: dt, inputs: this.player_inputs });
    }
  },

  render: function() {
    // render
    this.app.renderer.render(this.scene, this.camera);
  },

};
