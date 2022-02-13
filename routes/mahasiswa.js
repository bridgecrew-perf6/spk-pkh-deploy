const { upload } = require('../uploads')
const { db } = require('../db');
const _ = require('lodash')

module.exports = async (fastify) => {

	fastify.get('/', {
		handler: async (request, reply) => {
			const items = await db.mahasiswa.findMany({
				include: {
					penilaians: true
				}
			})
			reply.view('app/mahasiswa/list', {
				title: 'Data Mahasiswa',
				subtitle: 'List Data Mahasiswa',
				session: request.session,
				items
			})
		}
	});

	fastify.get('/me', {
		handler: async (request, reply) => {

			const mahasiswa = request.session.mahasiswa;
			let penilaian = [];
			if (mahasiswa) {
				penilaian = await db.penilaian.findMany({
					where: {
						mahasiswaId: mahasiswa.id
					}
				})
			}
			const penilaianDone = penilaian.length > 0;

			reply.view('app/mahasiswa/me', {
				title: 'Biodata Anda',
				subtitle: 'Data yang digunakan applikasi',
				session: request.session,
				penilaianDone
			})
		}
	})

	fastify.get('/me-input', {
		handler: async (request, reply) => {
			const session = request.session;
			const { mahasiswa } = session;
			reply.view('app/mahasiswa/me-input', {
				title: 'Biodata Anda',
				subtitle: 'Data yang digunakan applikasi',
				session: request.session,
				item: mahasiswa
			})
		}
	})

	fastify.post('/me-input', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			const { body } = request;
			console.log(body);
			const { mahasiswa, user } = request.session;

			const updatedUser = await db.user.update({
				where: {
					id: user.id
				},
				data: {
					mahasiswa: {
						upsert: {
							create: body,
							update: body
						}
					}
				},
				include: {
					mahasiswa: true
				}
			})

			request.session.mahasiswa = updatedUser.mahasiswa;

			reply.redirect('/app/mahasiswa/me')
		}
	})

	fastify.get('/me-penilaian', {
		handler: async (request, reply) => {
			const session = request.session;
			const { mahasiswa } = session;

			let krits = await db.kriteria.findMany({
				include: {
					subs: true
				}
			})
			krits = krits.map(kriteria => {
				kriteria.subs = _.sortBy(kriteria.subs, it => 5 - it.bobot)
				return kriteria;
			})

			let item = {};
			const penilaian = await db.penilaian.findMany({
				where: {
					mahasiswaId: mahasiswa.id
				},
				include: {
					subkriteria: {
						include: {
							kriteria: true
						}
					}
				}
			})

			penilaian.forEach(it => {
				item[`k${it.subkriteria.kriteria.id}`] = it.subkriteriaId;

				krits.forEach(kriteria => {
					if (kriteria.id != it.subkriteria.kriteria.id) {
						return;
					}
					kriteria.selected = it.subkriteriaId
				})
			})

			reply.view('app/mahasiswa/me-penilaian', {
				title: 'Penilaian',
				subtitle: 'Data yang diperlukan untuk penentuan penerima beasiswa',
				session: request.session,
				krits,
				item: penilaian
			})
		}
	})

	fastify.post('/me-penilaian', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			const body = request.body;
			const mahasiswa = request.session.mahasiswa;
			const mahasiswaId = mahasiswa.id;
			let payload = [];

			Object.keys(body).forEach((k) => {
				// const id = k.substring(1);
				console.log(k)
				const subKritId = parseInt(body[k]);
				payload.push({
					subkriteriaId: parseInt(subKritId),
					mahasiswaId
				})
			})

			const cleanQuery = db.penilaian.deleteMany({
				where: {
					mahasiswaId
				}
			})
			const insertQuery = db.penilaian.createMany({
				data: payload
			})

			await db.$transaction([cleanQuery, insertQuery]);

			reply.redirect('/app/mahasiswa/me')
		}
	})

	fastify.get('/:id/detail', {
		handler: async (request, reply) => {
			const id = parseInt(request.params.id)
			const mahasiswa = await db.mahasiswa.findFirst({
				where: {
					id
				}
			})

			let nilais = await db.penilaian.findMany({
				where: {
					mahasiswaId: id
				},
				include: {
					subkriteria: {
						include: {
							kriteria: true
						}
					}
				}
			})

			nilais = nilais.map(it => {
				return {
					label: it.subkriteria.kriteria.nama,
					selected: it.subkriteria.nama
				}
			})

			console.log(nilais)

			reply.view('app/mahasiswa/detail', {
				title: mahasiswa.nama,
				subtitle: 'Detail Data Mahasiswa',
				session: request.session,
				mahasiswa,
				nilais
			})
		}
	})

	fastify.get('/create', {
		handler: async (request, reply) => {
			reply.view('app/mahasiswa/create', {
				title: 'Data Mahasiswa',
				subtitle: 'Input Data Mahasiswa',
				session: request.session
			})
		}
	})

	fastify.post('/create', {
		handler: async (request, reply) => {

		}
	})

	fastify.get('/:id/edit', {
		handler: async (request, reply) => {

		}
	})

	fastify.post('/:id/edit', {
		handler: async (request, reply) => {

		}
	})

	fastify.get('/:id/delete', {
		handler: async (request, reply) => {
			
		}
	})

}