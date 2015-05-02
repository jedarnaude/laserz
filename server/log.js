// ============================================================================
// Container for logger
// Main purpose here is to have the ability to dump logs to different locations
// ============================================================================
var Minilog = require('minilog');
Minilog
    .pipe(Minilog.backends.console.formatWithStack)
    .pipe(Minilog.backends.console);

var log = Minilog('laserz');
module.exports = function () {
	return log;
};
