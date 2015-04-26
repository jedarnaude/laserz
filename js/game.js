var ENGINE = { };

ENGINE.Game = {

  create: function() {

    console.log("------------------------------------")
    console.log("Multiplayer game")
    console.log("------------------------------------")

    console.log("Create Game: " + this.app.width + "," + this.app.height)

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

    // network (should be handled here now its just for convinience)
    socket = io.connect('http://92.60.126.107:3000');
    socket.on('error', function() { console.error(arguments) });
    socket.on('message', function() { console.log(arguments) });

    gamepadSupport.init();

    // game
    this.game = new gameCreate(this.scene, socket);
  },

  resize: function() {
    console.log("Game Resize");
  },

  step: function(dt) {
    // game
    this.game.gameUpdate(dt);

    if (gamepadSupport.gamepads) {
      for (var i in gamepadSupport.gamepads) {
        var gamepad = gamepadSupport.gamepads[i];
      }
    }

  },

  render: function() {
    // render
    this.app.renderer.render(this.scene, this.camera);
  },

  keydown: function(data) {
    this.game.gameKeydown(data);
  },

  keyup: function(data) {
    this.game.gameKeyup(data);
  },

};
