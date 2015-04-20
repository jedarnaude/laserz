function color(r, g, b, a) {
  return new THREE.Color(r, g, b)
}

function vec2(x, y) {
  return new THREE.Vector2(x, y)
}

function vec3(x, y, z) {
  return new THREE.Vector3(x, y, z)
}

function logVec2(v) {
  return "vec2(" + v.x + "," + v.y + ")"
}

function logVec3(v) {
  return "vec3(" + v.x + "," + v.y + "," + v.z + ")"
}

function logColor(v) {
  return "color(" + v.r + "," + v.g + "," + v.b + ")"
}

function time01(t, ini, len) {
  var d = (t - ini) / len
  if (d > 1)
    d = 1
  return d
}

function to010(t) {
  var d = t * 2
  if (d < 1)
    return d
  return 2 - d
}

function lerp(a, b, t) {
  return (b - a) * t + a
}

function lerpColor(a, b, t) {
  return color(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t), 1)
}

function rotate(x, y, angle) {
  var s = Math.sin(angle)
  var c = Math.cos(angle)
  return vec2(x * c - y * s, x * s + y * c)
}

function nsin(t) {
  return Math.sin(t * PI_2) * 0.5 + 0.5
}

function flash(t) {
  return (Math.sin(t * PI_2 * FLASH_SPEED) > 0)
}

function distPointLine(px, py, x1, y1, x2, y2) {
  var A = px - x1
  var B = py - y1
  var C = x2 - x1
  var D = y2 - y1
  return Math.abs(A * D - C * B) / Math.sqrt(C * C + D * D)
}

function distsq(a, b) {
  var x = a.x - b.x
  var y = a.y - b.y
  return x * x + y * y
}

function random(min, max) {
  return Math.random() * (max - min) + min
}

function deleteDead(t, f) {
  var i = t.length
  while (i--) {
    if (t[i].dead) {
      f(t[i])
      t.splice(i, 1)
    }
  }
}

function deleteAll(t, f) {
  var i = t.length
  while (i--) {
    f(t[i])
    t.splice(i, 1)
  }
}

function getPosition(object) {
  return object.obj.position
}

function setPosition(object, pos) {
  //console.log("SetPosition: " + logVec3(pos))
  object.obj.position.set(pos.x, pos.y, pos.z)
}

function setRotation(object, rot) {
  //console.log("SetPosition: " + logVec3(pos))
  object.obj.rotation.set(rot.x, rot.y, rot.z)
}

function setScale(object, scale) {
  //console.log("SetScale: " + scale)
  object.obj.scale.set(scale, scale, scale)
}

function setColor(object, color) {
  //console.log("SetColor: " + logColor(color))
  object.obj.material.color = color
}

function setVisible(object, visible) {
  object.obj.visible = visible
}