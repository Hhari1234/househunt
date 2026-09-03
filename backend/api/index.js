// Vercel serverless function entry — re-use the existing Express app.
// Some Vercel Node runtimes detect functions more reliably when the file
// exports a plain handler `(req, res) => {}`. Wrap and delegate to the
// existing Express `app` so routes in `server.js` remain unchanged.

const app = require('../server');

module.exports = function handler(req, res) {
	// Delegate directly to the Express app instance.
	return app(req, res);
};
