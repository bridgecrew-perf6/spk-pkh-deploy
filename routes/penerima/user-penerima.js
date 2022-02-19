const { upload } = require('../../uploads')
const { db } = require('../../db')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const carbone = require('carbone')
const format = require('date-fns/format')
const { id: localeId } = require('date-fns/locale')

module.exports = async (fastify) => {

	fastify.get('/', {
		handler: async (request, reply) => {
			console.log('request.session')
			console.log(request.session)
			// Check if user has input penilaian
			const totalPenilaian = await db.penilaian.count({
				where: {
					penerimaBantuanId: request.session.penerimaBantuan.id
				}
			})
			const penilaianDone = totalPenilaian > 0

			reply.view('app/penerima-bantuan/me/index.html', {
				title: 'Data Penerima Bantuan',
				subtitle: 'Data Penerima Bantuan',
				session: request.session,
				penilaianDone
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

      reply.redirect('/app/penerima/me')
		}
	})

	fastify.get('/bukti-input', {
		handler: async (request, reply) => {
			const session = request.session
			const templateFullPath = path.join(process.cwd(), 'doc-template', 'bukti-penilaian.docx')
			let penerimaBantuan = request.session.penerimaBantuan
			penerimaBantuan.rtRw = `${penerimaBantuan.rt.padStart(3, '0')}/${penerimaBantuan.rw.padStart(3, '0')}`
			const tanggal = format(new Date(), 'kk:mm, d MMMM yyyy', { locale: localeId })
			const penilaians = await db.penilaian.findMany({
				orderBy: {
					subkriteria: {
						kriteria: {
							bobot: 'desc'
						}
					}
				},
        include: {
        	subkriteria: {
        		include: {
        			kriteria: true
        		}
        	}
        },
        where: {
          subkriteriaId: {
            gt: 0
          },
          penerimaBantuanId: penerimaBantuan.id
        }
      })
			const data = {
				penerimaBantuan,
				tanggal,
				penilaians
			}
			const buffer = await new Promise((resolve, reject) => {
				carbone.render(templateFullPath, data, function(err, result){
				  if (err) {
				    reject(err);
				  }
				  // write the result
				  resolve(result);
				});
			});

			const filename = 'bukti-input.docx';

			reply
				.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
				.header('Content-Disposition', `attachment;filename="${filename}"`)
				.send(buffer);
		}
	})

}