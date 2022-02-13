const { upload } = require('../../uploads')
const { db } = require('../../db');
const _ = require('lodash')

module.exports = async (fastify) => {

	fastify.get('/', {
		handler: async (request, reply) => {
			console.log('request.session')
			console.log(request.session)
			reply.view('app/penerima-bantuan/me/index.html', {
				title: 'Data Penerima Bantuan',
				subtitle: 'Data Penerima Bantuan',
				session: request.session
			})
		}
	})

	fastify.get('/biodata', {
		handler: async (request, reply) => {
			reply.view('app/penerima-bantuan/me/biodata.html', {
				title: 'Data Penerima Bantuan',
				subtitle: 'Biodata Penerima Bantuan',
				session: request.session
			})
		}
	})

	fastify.post('/biodata', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			const { body } = request;
			const penerimaBantuan = await db.penerimaBantuan.create({
				data: body
			})
			const { user } = request.session
			if (!user) {
				throw new Error('user undefined')
			}
			const payload = {
				penerimaBantuanId: penerimaBantuan.id
			}
			const updateResult = await db.user.update({
				where: {
					id: user.id
				},
				data: payload
			})

			// Update session. Reload user
			const userToSave = await db.user.findFirst({
				where: { id: user.id }, 
				include: {
					penerimaBantuan: true
				}
			})
			request.session.user = userToSave;
			request.session.penerimaBantuan = userToSave.penerimaBantuan;

			reply.redirect('/app/penerima/me')
		}
	})

	fastify.get('/penilaian', {
		handler: async (request, reply) => {
			const aktifPeriode = await db.periode.findFirst({ where: { aktif: true } })
			const kriteriaList = await db.kriteria.findMany({
        include: {
          subs: true
        },
        orderBy: {
          'bobot': 'desc'
        }
      })
			reply.view('app/penerima-bantuan/me/penilaian', {
				title: 'Data Penerima Bantuan',
				subtitle: 'Data Penilaian Penerima Bantuan',
				session: request.session,
				aktifPeriode,
				kriteriaList
			})
		}
	})

	fastify.post('/penilaian', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			let { periodeId, ...rest } = request.body
			const { user, penerimaBantuan } = request.session
      penerimaBantuanId = penerimaBantuan.id
      periodeId = parseInt(periodeId)
      let penilaianList = []
      Object.keys(rest).forEach(k => {
        penilaianList.push({
          penerimaBantuanId,
          periodeId,
          subkriteriaId: parseInt(rest[k])
        })
      })
			console.log('penilaianList')
			console.log(penilaianList)
			const updateDeleteCondition = {
				penerimaBantuanId,
				periodeId
			}
			const totalPenilaian = await db.penilaian.count({
				where: updateDeleteCondition
			})
			let statements = []
			if (totalPenilaian > 0) {
				statements.push(db.penilaian.deleteMany({
					where: updateDeleteCondition
				}))
			}
			statements.push(db.penilaian.createMany({
				data: penilaianList
			}))

      const result = await db.$transaction(statements)
			console.log(result)

      reply.redirect('/app/penilaian')
		}
	})

}