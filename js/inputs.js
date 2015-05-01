var Buttons = {
  Up: 1<<0,
  Down: 1<<1,
  Left: 1<<2,
  Right: 1<<3,
  A: 1<<4,
  B: 1<<5,
  X: 1<<6,
  Y: 1<<7,
  L1: 1<<8,
  L2: 1<<9,
  R1: 1<<10,
  R2: 1<<11,
};

//-------------------------------------------------------------------------------------------------
// Keyboard input helper
//-------------------------------------------------------------------------------------------------
function InputKeyboard(player_index) {
  if (player_index != 0 && player_index != 1)
    console.log("InputKeyboard: Player index " + player_index + " not supported");
  this.player_index = player_index;
  this.clear();
}

InputKeyboard.prototype.clear = function() {
  this.buttons_old = 0;
  this.buttons = 0;
  this.buttons_pressed = 0;
  this.buttons_released = 0;  
  this.trigger_l = 0; // [0-1]
  this.trigger_r = 0; // [0-1]
  this.analog_l = {x:0,y:0}; // [-1,1]  
  this.analog_r = {x:0,y:0}; // [-1,1]
}

InputKeyboard.prototype.checkButton = function(pressed,button) {
  if (pressed)
    this.buttons |= button;
  else
    this.buttons &= ~button;
}

InputKeyboard.prototype.update = function(keyboard) {
  switch (this.player_index) {
    case 0:
      this.checkButton(keyboard.keys.up, Buttons.Up);
      this.checkButton(keyboard.keys.down, Buttons.Down);
      this.checkButton(keyboard.keys.left, Buttons.Left);
      this.checkButton(keyboard.keys.right, Buttons.Right);
      this.checkButton(keyboard.keys.enter, Buttons.A);
      break;
    case 1:
      this.checkButton(keyboard.keys.w, Buttons.Up);
      this.checkButton(keyboard.keys.s, Buttons.Down);
      this.checkButton(keyboard.keys.a, Buttons.Left);
      this.checkButton(keyboard.keys.d, Buttons.Right);
      this.checkButton(keyboard.keys.space, Buttons.A);
      break;
  }
  // update button status
  this.buttons_pressed = (this.buttons_old ^ this.buttons) & this.buttons;
  this.buttons_released = (this.buttons_old ^ this.buttons) & this.buttons_old;
  this.buttons_old = this.buttons;
  this.analog_l.x = -this.buttons[Buttons.Left]+this.buttons[Buttons.Right];
  this.analog_l.y = -this.buttons[Buttons.Up]+this.buttons[Buttons.Down];    
}

//-------------------------------------------------------------------------------------------------
// Gamepad input helper
//-------------------------------------------------------------------------------------------------
function InputGamepad(player_index) {
  if (player_index != 0 && player_index != 1)
    console.log("InputGamepad: Player index " + player_index + " not supported");
  this.player_index = player_index;
  this.clear();
}

InputGamepad.prototype.clear = function() {
  this.buttons_old = 0;
  this.buttons = 0;
  this.buttons_pressed = 0;
  this.buttons_released = 0;  
  this.trigger_l = 0; // [0-1]
  this.trigger_r = 0; // [0-1]
  this.analog_r = {x:0,y:0}; // [-1,1]
  this.analog_l = {x:0,y:0}; // [-1,1]
}

InputGamepad.prototype.checkButton = function(pressed,button) {
  if (pressed)
    this.buttons |= button;
  else
    this.buttons &= ~button;
}

InputGamepad.prototype.update = function(gamepads) {
  var gamepad = app.gamepads[this.player_index];
  if (gamepad != undefined) {
    this.checkButton(gamepad.buttons["up"], Buttons.Up);
    this.checkButton(gamepad.buttons["down"], Buttons.Down);
    this.checkButton(gamepad.buttons["left"], Buttons.Left);
    this.checkButton(gamepad.buttons["right"], Buttons.Right);
    this.checkButton(gamepad.buttons["1"], Buttons.A);
    this.checkButton(gamepad.buttons["2"], Buttons.B);
    this.checkButton(gamepad.buttons["3"], Buttons.X);
    this.checkButton(gamepad.buttons["4"], Buttons.Y);
    this.checkButton(gamepad.buttons["l1"], Buttons.L1);
    this.checkButton(gamepad.buttons["l2"]>0.9, Buttons.L2);
    this.checkButton(gamepad.buttons["r1"], Buttons.R1);
    this.checkButton(gamepad.buttons["r2"]>0.9, Buttons.R2);
    this.trigger_l = gamepad.buttons["l2"];
    this.trigger_r = gamepad.buttons["r2"];
    this.analog_l.x = gamepad.sticks[0].x;
    this.analog_l.y = gamepad.sticks[0].y;
    this.analog_r.x = gamepad.sticks[1].x;
    this.analog_r.y = gamepad.sticks[1].y;
  }
  else
    this.clear();
  // update button state
  this.buttons_pressed = (this.buttons_old ^ this.buttons) & this.buttons;
  this.buttons_released = (this.buttons_old ^ this.buttons) & this.buttons_old;
  this.buttons_old = this.buttons;
}
