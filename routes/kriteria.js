const { upload } = require('../uploads')
const { db } = require('../db');
const { Decimal } = require('@prisma/client').Prisma;
const _ = require('lodash')

module.exports = async (fastify) => {

	fastify.get('/', {
		handler: async (request, reply) => {
			const kriterias = await db.kriteria.findMany({
				include: {
					subs: true
				}
			});
			reply.view('app/kriteria/list', {
				title: 'Data Kriteria',
				subtitle: 'Daftar kriteria',
				session: request.session,
				items: kriterias
			})
		}
	})

	fastify.get('/:id/edit', {
		handler: async (request, reply) => {
			const id = parseInt(request.params.id);
			const kriteria = await db.kriteria.findFirst({
				where: { id }
			})
			reply.view('app/kriteria/edit', {
				title: `Kriteria#${kriteria.id} -- ${kriteria.nama}`,
				subtitle: 'Edit Kriteria',
				session: request.session,
				item: kriteria
			})
		}
	})

	fastify.post('/:id/edit', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			const id = parseInt(request.params.id)
			const { body } = request;
			const payload = {
				nama: body.nama,
				bobot: body.bobot,
				core: body.tipe == 'core',
				target: parseInt(body.target)
			}
			await db.kriteria.update({
				where: {
					id
				},
				data: payload
			})
			reply.redirect(`/app/kriteria/${id}/detail`)
		}
	})

	fastify.get('/:id/detail', {
		schema: {
			querystring: {
				type: 'object',
				props: {
					id: { type: 'number', required: true, minimum: 10 }
				}
			}
		},
		handler: async (request, reply) => {
			const id = parseInt(request.params.id);
			let kriteria = await db.kriteria.findFirst({
				where: { id },
				include: {
					subs: true
				}
			})
			kriteria.subs = _.sortBy(kriteria.subs, it => 5 - it.bobot)
			reply.view('app/kriteria/detail', {
				title: `Kriteria#${kriteria.id} -- ${kriteria.nama}`,
				subtitle: 'Detail Kriteria',
				session: request.session,
				item: kriteria
			})
		}
	})

	fastify.get('/create', {
		handler: async (request, reply) => {
			const err_bobot = request.gflash('err_bobot')
			reply.view('app/kriteria/create', {
				title: 'Data Kriteria',
				subtitle: 'Input data kriteria',
				session: request.session,
				err_bobot
			})
		}
	})

	fastify.post('/create', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			const payload = request.body;
			let { nama, bobot, tipe, target } = request.body;
			const allKrits = await db.kriteria.findMany({})
			console.log(allKrits)
			const prevTotalBobot = allKrits.map(it => it.bobot).reduce((a, b) => a.add(b), new Decimal('0'))

			const nextBobot = prevTotalBobot.add(new Decimal(bobot))
			if (nextBobot.greaterThan(new Decimal('100'))) {
				request.sflash('err_bobot', 'Total bobot melebihi dari 100')
				reply.redirect('/app/kriteria/create')
				return
			}
			const kriteria = await db.kriteria.create({
				data: {
					nama,
					bobot,
					core: tipe == 'core',
					target: parseInt(target)
				}
			})
			reply.redirect('/app/kriteria');
		}
	})

	fastify.get('/:id/remove', {
		handler: async (request, reply) => {
			const id = parseInt(request.params.id)
			const kriteria = await db.kriteria.findFirst({
				where: { id }
			})

			const deleteSubs = db.subkriteria.deleteMany({
				where: {
					kriteriaId: kriteria.id 
				}
			})
			const deleteKrit = db.kriteria.delete({
				where: {
					id
				}
			})

			await db.$transaction([deleteSubs, deleteKrit]);
			reply.redirect('/app/kriteria')
		}
	})

}