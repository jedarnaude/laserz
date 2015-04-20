var app = new PLAYGROUND.Application({

  create: function() {
    console.log("Create App");
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer = new THREE.WebGLRenderer( { antialiasing: false } );
    //this.renderer = new THREE.WebGLDeferredRenderer( { width: this.width, height: this.height, antialias: true } );
    //this.renderer.gammaInput = true;
    //this.renderer.gammaOutput = true;
    //this.renderer.shadowMapEnabled = true;
    //this.renderer.shadowMapCullFace = THREE.CullFaceBack;
    //this.renderer.shadowMapType = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0);
    this.renderer.setSize(this.width, this.height);
    this.renderer.domElement.style.width = this.width + "px";
    this.renderer.domElement.style.height = this.height + "px";
    document.body.appendChild(this.renderer.domElement);
  },

  resize: function() {
    this.renderer.domElement.style.width = this.width + "px";
    this.renderer.domElement.style.height = this.height + "px";
  },

  ready: function() {
    this.setState(ENGINE.Game);
  },

});