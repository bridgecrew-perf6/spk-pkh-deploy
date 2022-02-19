const { upload } = require('../uploads')
const { db } = require('../db');

module.exports = async (fastify) => {

	fastify.get('/create', {
		handler: async (request, reply) => {
			const { query } = request;
			let kriteria = query.kriteria ? parseInt(query.kriteria) : null;

			const kriterias = await db.kriteria.findMany({});
			const err_bobot = request.gflash('err_bobot');
			reply.view('app/subkriteria/create', {
				title: 'Data Sub Kriteria',
				subtitle: 'Input data sub kriteria',
				session: request.session,
				kriterias,
				kriteria
			})
		}
	})

	fastify.post('/create', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			const { kriteriaId, nama, bobot, tipe } = request.body;
			const payload = {
				kriteriaId: parseInt(kriteriaId),
				nama,
				bobot: parseInt(bobot)
			}
			console.log(payload)
			const sub = await db.subkriteria.create({
				data: payload
			})
			reply.redirect(`/app/kriteria/${kriteriaId}/detail`);
		}
	})

	fastify.get('/:id/remove', {
		handler: async (request, reply) => {
			const id = parseInt(request.params.id);
			const sub = await db.subkriteria.delete({
				where: {
					id
				}
			});
			reply.redirect(`/app/kriteria/${sub.kriteriaId}/detail`);
		}
	})

	fastify.get('/:id/edit', {
		handler: async (request, reply) => {
			const id = parseInt(request.params.id);
			const item = await db.subkriteria.findFirst({
				where: {
					id
				},
				include: {
					kriteria: true
				}
			});
			reply.view('app/subkriteria/edit', {
				title: 'Data Sub Kriteria',
				subtitle: 'Edit data sub kriteria',
				session: request.session,
				item
			})
		}
	})

	fastify.post('/:id/edit', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			const subkriteriaId = parseInt(request.params.id)
			const { nama, bobot } = request.body;
			const payload = {
				nama,
				bobot: parseInt(bobot)
			}
			const updateResult = await db.subkriteria.update({
				where: {
					id: subkriteriaId
				},
				data: payload
			})
			reply.redirect(`/app/kriteria/${updateResult.kriteriaId}/detail`);
		}
	})

}