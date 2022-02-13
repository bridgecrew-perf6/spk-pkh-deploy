const multer = require('fastify-multer') // or import multer from 'fastify-multer'

module.exports.upload = multer({ dest: 'uploads/' })