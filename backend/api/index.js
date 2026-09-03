// Vercel serverless function entry — re-use the existing Express app
// Vercel maps requests under /api/* to files in this folder. Export the
// Express `app` so Vercel's Node runtime can handle routes defined in
// server.js (which mounts /api/v1 routes).

const app = require('../server');

module.exports = app;
