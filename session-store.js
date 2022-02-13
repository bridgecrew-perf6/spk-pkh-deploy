const fastifySession = require('fastify-session');
const SessionFileStore = require('session-file-store');
const FileStore = new SessionFileStore(fastifySession);
module.exports.store = new FileStore({});
module.exports.session = fastifySession;