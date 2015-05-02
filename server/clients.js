// ============================================================================
// This file contains user data
// ============================================================================
var log = require('./log');

function generateClientId() {
    generateClientId.count = ++generateClientId.count || 1;
    return generateClientId.count;
}

var clients = {};
module.exports = {
  get: function(filter) {
    return clients;
  },
  
  create: function (name) {
    // NOTE(jose): this is a struct so we can keep adding components to users (like win, losses, friends, etc...)
    var new_client = {};
    new_client.name = name;
    new_client.id = generateClientId();

    clients[new_client.id] = new_client;

    log().info('new user ( ' + new_client.id + ' )');

    return new_client;
  },
};
