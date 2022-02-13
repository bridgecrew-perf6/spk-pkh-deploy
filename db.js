const { PrismaClient } = require('@prisma/client')

module.exports.db = new PrismaClient()
