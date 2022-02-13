const { upload } = require('../uploads')
const { db } = require('../db');
const { Decimal } = require('@prisma/client').Prisma;
const _ = require('lodash')

module.exports = async (fastify) => {

	fastify.get('/', {
		handler: async (request, reply) => {
			const periodes = await db.periode.findMany();
			reply.view('app/periode/list', {
				title: 'Data Periode',
				subtitle: 'Daftar Periode',
				session: request.session,
				items: periodes
			})
		}
	})

	fastify.get('/create', {
		handler: async (request, reply) => {
			reply.view('app/periode/create', {
				title: 'Data Periode',
				subtitle: 'Input data periode',
				session: request.session
			})
		}
	})

	fastify.post('/create', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			let { tahun, aktif } = request.body;

			if (aktif == 'on') {
				// Turn off aktif field on every existing periode
				await db.periode.updateMany({
					data: {
						aktif: false
					}
				})
			}

			const payload = {
				tahun: parseInt(tahun),
				aktif: aktif == 'on'
			}

			const periode = await db.periode.create({
				data: payload
			})
			reply.redirect('/app/periode');
		}
	})

	fastify.get('/:id/remove', {
		handler: async (request, reply) => {
			const id = parseInt(request.params.id)
			await db.periode.delete({
				where: { id }
			})
			reply.redirect('/app/periode')
		}
	})

	fastify.get('/:id/edit', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			const id = parseInt(request.params.id)
			const periode = await db.periode.findFirst({ where: { id } })
			reply.view('app/periode/edit', {
				item: periode,
				title: 'Data Periode',
				subtitle: 'Edit Periode',
				session: request.session
			})
		}
	})

	fastify.post('/:id/edit', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			let { tahun, semester, aktif } = request.body;

			if (aktif == 'on') {
				// Turn off aktif field on every existing periode
				await db.periode.updateMany({
					data: {
						aktif: false
					}
				})
			}

			const payload = {
				tahun: parseInt(tahun),
				aktif: aktif == 'on'
			}

			const updateResult = await db.periode.update({
				where: {
					id: parseInt(request.params.id)
				},
				data: payload
			})
			reply.redirect('/app/periode');
		}
	})

}