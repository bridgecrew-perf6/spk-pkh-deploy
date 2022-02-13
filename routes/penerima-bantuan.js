const { upload } = require('../uploads')
const { db } = require('../db');
const _ = require('lodash')

module.exports = async (fastify) => {

	fastify.get('/', {
		handler: async (request, reply) => {
			const items = await db.penerimaBantuan.findMany({})
			reply.view('app/penerima-bantuan/list', {
				title: 'Data Penerima Bantuan',
				subtitle: 'Daftar Penerima Bantuan',
				session: request.session,
				items
			})
		}
	})

	fastify.get('/create', {
		handler: async (request, reply) => {
			reply.view('app/penerima-bantuan/create', {
				session: request.session,
				title: 'Data Penerima Bantuan',
				subtitle: 'Input Data Penerima Bantuan'
			})
		}
	})

	fastify.post('/create', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			const { body } = request;
			const penerimaBantuan = await db.penerimaBantuan.create({
				data: body
			})
			reply.redirect('/app/penerima-bantuan')
		}
	})

	fastify.get('/:id/remove', {
		handler: async (request, reply) => {
			const id = parseInt(request.params.id)
			const kriteria = await db.penerimaBantuan.delete({
				where: { id }
			})
			reply.redirect('/app/penerima-bantuan')
		}
	})

}