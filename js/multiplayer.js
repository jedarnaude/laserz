function gameCreate(main_scene, socket) {

  //-----------------------------------------
  // game vars
  //-----------------------------------------
  var time = 0;
  var time_add_mine = 0;
  var game_over = true;
  var game_players = 0;
  var scene = main_scene;
  var objects = [];
  var sphere_glow = THREE.ImageUtils.loadTexture('assets/sphere_glow.jpg');
  var laser_glow = THREE.ImageUtils.loadTexture('assets/laser_glow.jpg');
  objects["sphere"] = new THREE.SphereGeometry( 75,12,12 );
  objects["laser"] = new THREE.BoxGeometry( 10000,10,10 );
  objects["mine"] = new THREE.SphereGeometry( 75,4,3 );
  objects["sphere_glow"] = new THREE.PlaneBufferGeometry( 75,75 );
  objects["laser_glow"] = new THREE.PlaneBufferGeometry( 10000,10 );
  objects["mine_glow"] = new THREE.PlaneBufferGeometry( 75,75 );

  function createMaterial(name) {
    if (name == "sphere_glow") return new THREE.MeshLambertMaterial( { color: 0xFFFFFF, transparent: true, map: sphere_glow, blending: THREE.AdditiveBlending, } );
    if (name == "laser_glow") return new THREE.MeshLambertMaterial( { color: 0xFFFFFF, transparent: true, map: laser_glow, blending: THREE.AdditiveBlending, opacity: 0.5 } );
    if (name == "mine_glow") return new THREE.MeshLambertMaterial( { color: 0xFFFFFF, transparent: true, map: sphere_glow, blending: THREE.AdditiveBlending, } );
    return new THREE.MeshLambertMaterial( { color: 0xFFFFFF } );
  }

  function createObject(name) {
    console.log("Spawn object: " + name);
    var obj = new THREE.Mesh(objects[name], createMaterial(name));
    var new_object = { obj: obj };
    scene.add(obj);    
    return new_object;
  }

  //-----------------------------------------
  // players
  //-----------------------------------------
  console.log("Init Players");
  var players = [];
  for (var i = 0; i < 4; i++) {
    var player = createObject("sphere");
    setVisible(player, false);
    setScale(player, PLAYER_SCALE);
    setColor(player, COLORS_PLAYER[i]);
    players.push(player);
    // glow
    player.light = createObject("sphere_glow");
    setVisible(player.light, false);
    setScale(player.light, LIGHT_SCALE);
    setColor(player.light, COLORS_PLAYER[i]);
  }

  //-----------------------------------------
  // Network hacks
  //-----------------------------------------
  var GAME_WAITING = 0;
  var GAME_INPROGRESS = 1;
  var GAME_PAUSED = 2;
  var GAME_RESUME = 3;
  var GAME_OVER = 4;
  var game_state = GAME_WAITING;
  var game_options;
  // NOTE(jordi): this should only need a function getPlayerId that gets the local player or players from game_options.room_clients
  var game_playerid = 0;  
  // NOTE(jordi): to be replaced with full inputmanager structure
  var game_inputs = { left: false, right: false, up: false, down: false, action: false };

  //-----------------------------------------
  // lasers
  //-----------------------------------------
  var lasers = [];
  function createLaser(pos, owner, direction) {
    console.log("Create laser: " + owner)
    var laser = createObject("laser");
    setColor(laser, COLORS_RAY[owner]);
    setPosition(laser, vec3(pos.x,pos.y,LIGHT_POS_Z+0.5));
    setScale(laser, LASER_SCALE);
    // glow
    laser.light = createObject("laser_glow");
    setPosition(laser.light, vec3(pos.x,pos.y,LIGHT_POS_Z));
    setScale(laser.light, LASER_SCALE * 6);
    setColor(laser.light, COLORS_PLAYER[owner]);
    // game vars
    laser.owner = owner;
    laser.direction = direction;
    laser.angle = random(0, PI_2);
    laser.speed = 1.0 / random(25.0, 40.0);
    laser.line = {
      x1: pos.x,
      y1: pos.y,
      x2: 0,
      y2: 0,
    };
    laser.spawn = true;
    laser.time_spawn = time;
    laser.alive = false;
    laser.dead = false;
    laser.die = false;
    lasers.push(laser);
  }

  //-----------------------------------------
  // mines
  //-----------------------------------------
  var mines = [];
  function createMine() {
    if (mines.length > 5) return;
    for (var j = 0; j < 5; j++) {
      var ok = true;
      var pos = vec3(random(-SCR_X * 0.8, SCR_X * 0.8), random(-SCR_Y * 0.8, SCR_Y * 0.8), Z_POS);
      for (i = 0; i < 4; i++) {
        var player = players[i];
        if (player.alive) {
          var dist = distsq(getPosition(player), pos);
          if (dist < MINE_PROXIMITY_DIST_SQ)
            ok = false;
        }
      }
      // added?
      if (ok) {
        var mine = createObject("mine");
        setColor(mine, COLOR_MINE);
        setScale(mine, MINE_SCALE);
        setPosition(mine, pos);
        // glow
        mine.light = createObject("mine_glow");
        setScale(mine.light, MINE_SCALE*3.5);
        setPosition(mine.light, vec3(pos.x,pos.y,LIGHT_POS_Z));
        // game vars        
        mine.spawn = true;
        mine.time_spawn = time;
        mine.alive = false;
        mine.die = false;
        mine.dead = false;
        mines.push(mine);
        console.log("New mine (" + mines.length + ") " + logVec3(pos))    
        return;
      }
    }
  }

  //-----------------------------------------
  // game
  //-----------------------------------------  
  function gameStart(options) {
    console.log(">>> Start new game");

    // Seeding our random number generator
    Math.seedrandom(options.seed);

    // delete previous mines/lasers
    deleteAll(lasers, function(laser) {
      console.log("Remove laser");
      scene.remove(laser.light.obj);
      scene.remove(laser.obj);
    });
    // delete dead mines
    deleteAll(mines, function(mine) {
      console.log("Remove mine");
      scene.remove(mine.light.obj);
      scene.remove(mine.obj);
    });
    // create players    
    game_players = 0;
    for (var i = 0; i < 4; i++) {
      var enabled = (i<2);
      var player = players[i];
      setVisible(player, enabled);
      setScale(player, PLAYER_SCALE);
      setColor(player, COLORS_PLAYER[i]);
      setVisible(player.light, enabled);
      setScale(player.light, LIGHT_SCALE);
      setColor(player.light, COLORS_PLAYER[i]);
      player.enabled = enabled;
      player.alive = player.enabled;
      player.dead = false;
      player.die = false;
      player.time_die = 0;
      player.mine = true;
      player.time_mine = 0;
      player.laser = false;
      player.time_laser = 0;
      player.num_lasers = 0;
      player.transparent = false;
      player.speed = vec2(0,0);
      player.action = false;
      if (player.enabled)
        game_players++;
    }
    var x = SCR_X * 0.5
    var y = SCR_Y * 0.5
    setPosition(players[0], vec3(-x,-y, Z_POS));
    setPosition(players[1], vec3(-x, y, Z_POS));
    setPosition(players[2], vec3( x,-y, Z_POS));
    setPosition(players[3], vec3( x, y, Z_POS));

    // add some initial random mines
    for (var i = 0; i < game_players; i++) {
      createMine();
    }
    game_over = false;
    time_add_mine = time;
    game_state = GAME_INPROGRESS;
    console.log("Num players: " + game_players);
  }

  function gameOver() {
    game_over = true;
    game_state = GAME_OVER;
    socket.emit('game over', {});
  }

  //-----------------------------------------
  // gameRunCollisions
  //-----------------------------------------
  function gameRunCollisions() {

    // for each alive player
    for (var i = 0; i < game_players; i++) {
      var player = players[i];
      if (!player.alive)
        continue;
      var pos = getPosition(player);

      // if player has no mine, check against all alive mines
      if (!player.mine && !player.transparent) {
        for (var j = 0; j < mines.length; j++) {
          if (mines[j].alive) {
            var dist = distsq(getPosition(player), getPosition(mines[j]));
            //console.log("Player " + i + " dist to mine " + dist);
            if (dist < DIST_MINE_SQ) {
              console.log("Player " + i + " got mine");
              player.mine = true;
              player.time_mine = time;
              mines[j].alive = false;
              mines[j].dead = false;
              mines[j].die = true;
              mines[j].time_die = time;
              break;
            }
          }
        }
      }

      // if player is not transparent, check against all alive lasers
      if (!player.transparent) {
        for (var j = 0; j < lasers.length; j++) {
          if (lasers[j].alive) {
            var line = lasers[j].line;
            var dist = distPointLine(pos.x, pos.y, line.x1, line.y1, line.x2, line.y2);
            // if close and different owner, die!
            if (lasers[j].owner != i) {
              //console.log("Dist " + lasers[j].owner + ", " + i + ", " + dist);
              if (dist < DIST_LINE) {
                console.log("Player DEAD!!! " + i);
                player.alive = false;
                player.dead = false;
                player.die = true;
                player.time_die = time;
                game_players = game_players - 1;
                if (game_players == 1) {
                  console.log("Game over!");
                  gameOver();
                }
                break;
              }
            }
          }
        }
      }

    }
  }


  //-----------------------------------------
  // gamerun
  //-----------------------------------------
  function gameRun(delta) {

    // drop mines
    if (!game_over) {
      if (time - time_add_mine > TIME_MINES) {
        time_add_mine = time;
        createMine();
      }
    }

    var test = false;
    // update players
    for (var i = 0; i < game_players; i++) {
      var player = players[i];
      // die bicho
      if (player.die) {
        // flash
        var t = time01(time, player.time_die, PLAYER_MINE_LEN);
        if (t < 1) {
          setVisible(player, flash(time));
          setColor(player, COLOR_DIE);
          setVisible(player.light, flash(time));
        } else {
          setVisible(player, visible);
          setVisible(player.light, visible);
          player.alive = false;
        }
      }

      // do alive stuff
      if (player.alive) {
        var pos = getPosition(player);
        // flash
        if (player.transparent)
          setVisible(player, flash(time));
        else
          setVisible(player, true);
        // mine
        if (player.mine) {
          // flash
          var t = time01(time, player.time_mine, PLAYER_MINE_LEN);
          var f = to010(t);
          setScale(player, lerp(PLAYER_SCALE, PLAYER_SCALE_MINE, t));
          setColor(player, lerpColor(COLORS_PLAYER_MINE[i], COLOR_FLASH, f));
          setScale(player.light, lerp(LIGHT_SCALE, LIGHT_SCALE_MINE, t));
          // update pos
          pos.x = pos.x + player.speed.x * delta * PLAYER_SPEED_MINE
          pos.y = pos.y + player.speed.y * delta * PLAYER_SPEED_MINE
        } else {
          // flash
          var t = time01(time, player.time_laser, PLAYER_LASER_LEN);
          var f = to010(t);
          setScale(player, lerp(PLAYER_SCALE_MINE, PLAYER_SCALE, t));
          setColor(player, lerpColor(COLORS_PLAYER[i], COLOR_FLASH, f));
          setScale(player.light, lerp(LIGHT_SCALE_MINE, LIGHT_SCALE, t));
          // update pos
          pos.x = pos.x + player.speed.x * delta * PLAYER_SPEED
          pos.y = pos.y + player.speed.y * delta * PLAYER_SPEED
        }
        // warp ?
        if (pos.x < -SCR_X) pos.x = SCR_X;
        if (pos.y < -SCR_Y) pos.y = SCR_Y;
        if (pos.x > SCR_X) pos.x = -SCR_X;
        if (pos.y > SCR_Y) pos.y = -SCR_Y;
        //console.log("Player speed: " + logVec2(player.speed) + " delta " + delta + " Speed = " + PLAYER_SPEED_MINE)
        setPosition(player, pos);
        setPosition(player.light, vec3(pos.x,pos.y,LIGHT_POS_Z));
        // actions
        if (player.transparent) {
          // transparent ignore actions
          var t = time - player.time_transparent;
          if (t > TRANS_TIME) {
            setColor(player, COLORS_PLAYER[i]);
            player.transparent = false;
            console.log("Player " + i + " end TRANSPARENT");
          }
        } else {
          // alive
          if (!game_over) {
            var laser_dir = 0
            if (player.action) {
              player.action = false;
              if (player.mine) {
                // drop laser
                if (random(0.0,1.0) > 0.5)
                  laser_dir = 1;
                else
                  laser_dir =-1;        
                createLaser(pos, i, laser_dir);
                player.mine = false;
                player.laser = true;
                player.time_laser = time;
                player.num_lasers = player.num_lasers + 1;
                console.log("Player " + i + " DROP laser (lasers = " + player.num_lasers + ")");
              } else {
                // if we have lasers, deactivate one and we become transparent / invincible for a while
                if (player.num_lasers > 0) {
                  player.num_lasers = player.num_lasers - 1;
                  player.transparent = true;
                  player.time_transparent = time;
                  setColor(player, COLORS_PLAYER_TRANS[i]);
                  console.log("Player " + i + " set TRANSPARENT (lasers = " + player.num_lasers + ")");
                  // update lasers
                  for (var j = 0; j < lasers.length; j++) {
                    if (lasers[j].alive && lasers[j].owner == i) {
                      console.log("  Removed laser from owner = " + lasers[j].owner);
                      lasers[j].alive = false;
                      lasers[j].die = true;
                      lasers[j].time_die = time;
              test = true;
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    // update lasers
    for (var j = 0; j < lasers.length; j++) {
      // spawn
      if (lasers[j].spawn) {
        var t = time01(time, lasers[j].time_spawn, LASER_SPAWN_LEN);
        if (t < 1) {
          setVisible(lasers[j], flash(time));
          setScale(lasers[j], LASER_SCALE * t);
          setRotation(lasers[j], vec3(0,0,lasers[j].angle));
          setRotation(lasers[j].light, vec3(0,0,lasers[j].angle));
          setVisible(lasers[j].light, flash(time));
        } else {
          setVisible(lasers[j], true);
          setScale(lasers[j], LASER_SCALE);
          setVisible(lasers[j].light, true);
          lasers[j].spawn = false;
          lasers[j].alive = true;
        }
      }
      // alive
      if (lasers[j].alive) {
        // Rotate
        lasers[j].angle = lasers[j].angle + lasers[j].direction * delta * PI_2 * lasers[j].speed;
        setRotation(lasers[j], vec3(0,0,lasers[j].angle));
        setRotation(lasers[j].light, vec3(0,0,lasers[j].angle));
        var p = rotate(1, 0, lasers[j].angle);
        lasers[j].line.x2 = lasers[j].line.x1 + p.x;
        lasers[j].line.y2 = lasers[j].line.y1 + p.y;
      }
      // die
      if (lasers[j].die) {
        // Rotate
      console.log("Die laser")
        var t = time01(time, lasers[j].time_die, LASER_DIE_LEN);
        if (t < 1) {
          setVisible(lasers[j], flash(time));
          setScale(lasers[j], LASER_SCALE * (1 - t));
          setVisible(lasers[j].light, flash(time));
          setScale(lasers[j].light, LASER_SCALE * 6 * (1 - t));
        } else
          lasers[j].dead = true;
      }
    }
    // delete dead lasers
    deleteDead(lasers, function(laser) { scene.remove(laser.obj); scene.remove(laser.light.obj); })

    // update mines
    for (var j = 0; j < mines.length; j++) {
      setRotation(mines[j], vec3(0,0,mines[j].time_spawn + time*0.9));
      mines[j].light.obj.material.opacity = nsin(mines[j].time_spawn + time*0.9) * 0.5 + 0.5;
      // spawn
      if (mines[j].spawn) {
        var t = time01(time, mines[j].time_spawn, MINE_SPAWN_LEN);
        if (t < 1) {
          setVisible(mines[j], flash(time));
          setVisible(mines[j].light, flash(time));
          setScale(mines[j], MINE_SCALE * t);
        } else {
          setVisible(mines[j], true);
          setVisible(mines[j].light, true);
          mines[j].spawn = false;
          mines[j].alive = true;
        }
      }
      // die
      if (mines[j].die) {
      console.log("Delete mine (" + mines.length + ")")
        var t = time01(time, mines[j].time_die, MINE_DIE_LEN);
        if (t < 1) {
          setColor(mines[j], lerpColor(COLOR_MINE, COLOR_FLASH, t));
          setScale(mines[j], MINE_SCALE * (1 - t));
          setScale(mines[j].light, MINE_SCALE * 3.5 * (1 - t));
        } else
          mines[j].dead = true;
      }
    }
    // delete dead mines
    deleteDead(mines, function(mine) { scene.remove(mine.obj); scene.remove(mine.light.obj); })
  }

  function gameUpdate(delta,inputs) {
    time += delta;
    if (game_state == GAME_INPROGRESS) {
      // save input
      if (inputs[0]) {
        players[0].speed.x = ((inputs[0].buttons & Buttons.Left)?-1:0) + ((inputs[0].buttons & Buttons.Right)?1:0);
        players[0].speed.y = ((inputs[0].buttons & Buttons.Up)?0:-1) + ((inputs[0].buttons & Buttons.Down)?0:1);
        players[0].action = inputs[0].buttons_pressed & Buttons.A;
      }
      if (inputs[1]) {
        players[1].speed.x = ((inputs[1].buttons & Buttons.Left)?-1:0) + ((inputs[1].buttons & Buttons.Right)?1:0);
        players[1].speed.y = ((inputs[1].buttons & Buttons.Up)?0:-1) + ((inputs[1].buttons & Buttons.Down)?0:1);
        players[1].action = inputs[1].buttons_pressed & Buttons.A;
      }
      // run!
      gameRun(delta);
      gameRunCollisions();
    }
  }
  
  //-----------------------------------------
  // gameState
  //-----------------------------------------
  this.onRoomMessage = function(data) {
    switch (data.action) {
      case "game_start":
        // NOTE(jordi): hardcoded game_playerid for 2 players
        console.log("GameStart: Player = " + game_playerid);
        gameStart(data);
        break;
      case "game_update":
        // NOTE(jordi): hardcoded game_playerid for 2 players
        gameUpdate(data.delta, data.inputs);
        break;        
    }
  }
}
