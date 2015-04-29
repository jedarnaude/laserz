var Buttons = {
  Up: 1<<0,
  Down: 1<<1,
  Left: 1<<2,
  Right: 1<<3,
  A: 1<<4,
  B: 1<<5,
  X: 1<<6,
  Y: 1<<7,
  AnalogL: 1<<8,
  AnalogR: 1<<9,
  TriggerL: 1<<10,
  TriggerR: 1<<11,
};

//-------------------------------------------------------------------------------------------------
// Create input handler for keyboard or input
//-------------------------------------------------------------------------------------------------
function Input(keyboard, player_index) {
  if (keyboard)
    return new InputKeyboard(player_index);
  else
    return new InputGamepad(player_index);
}

//-------------------------------------------------------------------------------------------------
// Keyboard input helper
//-------------------------------------------------------------------------------------------------
function InputKeyboard(player_index) {
  if (player_index != 0 || player_index != 1)
    console.log("InputKeyboard: Player index " + player_index + " not supported");
  this.player_index = player_index;
  this.is_keyboard = true;
  this.clear();
}

InputKeyboard.prototype.clear = function() {
  this.buttons_old = 0;
  this.buttons = 0;
  this.buttons_pressed = 0;
  this.buttons_released = 0;  
  this.analog_r = {x:0,y:0}; // [-1,1]
  this.analog_l = {x:0,y:0}; // [-1,1]
  this.trigger_l = 0; // [0-1]
  this.trigger_r = 0; // [0-1]
}

InputKeyboard.prototype.update = function() {
  this.buttons_pressed = (this.buttons_old ^ this.buttons) & this.buttons;
  this.buttons_released = (this.buttons_old ^ this.buttons) & this.buttons_old;
  this.buttons_old = this.buttons;
  this.analog_l.x = -this.buttons[Buttons.Left] + this.buttons[Buttons.Right];
  this.analog_l.y = -this.buttons[Buttons.Up] + this.buttons[Buttons.Down];  
  this.trigger_r = this.buttons[Buttons.A];
  this.trigger_l = this.buttons[Buttons.A];
}

InputKeyboard.prototype.onKeyDown = function(key) {
  switch (this.player_index) {
    case 0:
      switch (key) {
        case 37: this.buttons |= Buttons.Left; break;
        case 38: this.buttons |= Buttons.Up; break;
        case 39: this.buttons |= Buttons.Right; break;
        case 40: this.buttons |= Buttons.Down; break;
        case 13: this.buttons |= Buttons.A; break;
      }
      break;
    case 1:
      switch (key) {
        case 65: this.buttons |= Buttons.Left; break;
        case 87: this.buttons |= Buttons.Up; break;
        case 68: this.buttons |= Buttons.Right; break;
        case 83: this.buttons |= Buttons.Down; break;
        case 32: this.buttons |= Buttons.A; break;
      }      
      break;
  }
}

InputKeyboard.prototype.onKeyUp = function(key) {
  switch (this.player_index) {
    case 0:
      switch (key) {
        case 37: this.buttons &= ~Buttons.Left; break;
        case 38: this.buttons &= ~Buttons.Up; break;
        case 39: this.buttons &= ~Buttons.Right; break;
        case 40: this.buttons &= ~Buttons.Down; break;
        case 13: this.buttons &= ~Buttons.A; break;
      }
      break;
    case 1:
      switch (key) {
        case 65: this.buttons &= ~Buttons.Left; break;
        case 87: this.buttons &= ~Buttons.Up; break;
        case 68: this.buttons &= ~Buttons.Right; break;
        case 83: this.buttons &= ~Buttons.Down; break;
        case 32: this.buttons &= ~Buttons.A; break;
      }      
      break;
  }
}

InputKeyboard.prototype.onGamepad = function(gamepad) {
}

//-------------------------------------------------------------------------------------------------
// Gamepad input helper
//-------------------------------------------------------------------------------------------------
function InputGamepad(player_index) {
  this.player_index = player_index;
  this.is_gamepad = true;
  this.clear();
}

InputGamepad.prototype.clear = function() {
  this.buttons_old = 0;
  this.buttons = 0;
  this.buttons_pressed = 0;
  this.buttons_released = 0;  
  this.analog_r = {x:0,y:0}; // [-1,1]
  this.analog_l = {x:0,y:0}; // [-1,1]
  this.trigger_l = 0; // [0-1]
  this.trigger_r = 0; // [0-1]
}

InputGamepad.prototype.update = function() {
  this.buttons_pressed = (this.buttons_old ^ this.buttons) & this.buttons;
  this.buttons_released = (this.buttons_old ^ this.buttons) & this.buttons_old;
  this.buttons_old = this.buttons;
}

InputGamepad.prototype.onKeyDown = function(key) {
}

InputGamepad.prototype.onKeyUp = function(key) {
}

InputGamepad.prototype.onGamepad = function(gamepads) {
  var gamepad = gamepads[this.player_index];
  if (gamepad != undefined) {
    if (gamepads.buttons[14]) this.buttons |= Buttons.Left; else this.buttons &= ~Buttons.Left;
    if (gamepads.buttons[12]) this.buttons |= Buttons.Up; else this.buttons &= ~Buttons.Up;
    if (gamepads.buttons[15]) this.buttons |= Buttons.Right; else this.buttons &= ~Buttons.Right;
    if (gamepads.buttons[13]) this.buttons |= Buttons.Down; else this.buttons &= ~Buttons.Down;
    if (gamepads.buttons[0]) this.buttons |= Buttons.A; else this.buttons &= ~Buttons.A;
    this.trigger_l = gamepads.buttons[6];
    this.trigger_r = gamepads.buttons[7];
    this.analog_l.x = gamepads.axis[0];
    this.analog_l.y = gamepads.axis[1];
    this.analog_r.x = gamepads.axis[2];
    this.analog_r.y = gamepads.axis[3];
  }
  else {
    this.buttons = 0;
    this.trigger_l = 0;
    this.trigger_r = 0;
    this.analog_l.x = 0;
    this.analog_l.y = 0;
    this.analog_r.x = 0;
    this.analog_r.y = 0;
  }
}  
