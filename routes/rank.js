const fs = require('fs')
const path = require('path')
const carbone = require('carbone')
const _ = require('lodash')
const format = require('date-fns/format')
const { id: localeId } = require('date-fns/locale')
const { db } = require('../db')
const { rank } = require('../serv/rank');

function mapGap(x) {
	if (x == 0) return 7;
	if (x == 1) return 6.5;
	if (x == -1) return 6;
	if (x == 2) return 5.5;
	if (x == -2) return  5;
	if (x == 3) return 4.5;
	if (x == -3) return 4;
	if (x == 4) return 3.5;
	if (x == -4) return 3;
	if (x == 5) return 2.5;
	if (x == -5) return 2;
	if (x == 6) return 1.5;
	if (x == -6) return 1;
	throw new Error(`x = ${x}`)
}

module.exports = async (fastify, options) => {

	async function loadPenerimaData(periodeId) {
		let items = await db.penerimaBantuan.findMany({
			include: {
				penilaians: {
					include: {
						subkriteria: {
							include: {
								kriteria: true
							}
						}
					}
				}
			},
			where: {
        penilaians: {
          every: {
            subkriteriaId: {
              gt: 0
            }
          },
          every: {
            periodeId
          }
        }
      }
		})
		return items;
	}

	fastify.get('/', {
		schema: {
      querystring: {
        type: 'object',
        properties: {
          periode: { type: 'number' }
        }
      }
    },
		handler: async (request, reply) => {
			let periodeId = null;
      let periode = null;
      if (!request.query.periode) {
        // Find aktif periode
        periode = await db.periode.findFirst({
          where: {
            aktif: true
          }
        })
        if (!periode) {
          throw new Error('There is no aktif periode')
        }
        periodeId = periode.id;
      } else {
        periodeId = parseInt(request.query.periode)
        periode = await db.periode.findFirst({
          where: {
            id: periodeId
          }
        })
      }

			const periodeList = await db.periode.findMany({})
			const items = await loadPenerimaData(periodeId);
			let kriterias = await db.kriteria.findMany({})

			const rankResult = rank({ kriterias, items });

			reply.view('app/rank-result', {
				title: 'Data Perangkingan',
				subtitle: 'Daftar Penerima Bantuan',
				session: request.session,
				VUE_DATA: {
					items: rankResult,
					periode,
					periodeList
				}
			})
		}
	})

	fastify.get('/print', {
		schema: {
      querystring: {
        type: 'object',
        properties: {
          periode: { type: 'number' }
        }
      }
    },
    handler: async (request, reply) => {
    	let periodeId = null;
      let periode = null;
      if (!request.query.periode) {
        // Find aktif periode
        periode = await db.periode.findFirst({
          where: {
            aktif: true
          }
        })
        if (!periode) {
          throw new Error('There is no aktif periode')
        }
        periodeId = periode.id;
      } else {
        periodeId = parseInt(request.query.periode)
        periode = await db.periode.findFirst({
          where: {
            id: periodeId
          }
        })
      }

			const periodeList = await db.periode.findMany({})
			const items = await loadPenerimaData(periodeId);
			let kriterias = await db.kriteria.findMany({})

			const rankResult = rank({ kriterias, items });
			const tanggal = format(new Date(), 'kk:mm, EEEE, d MMMM yyyy', { locale: localeId })

			const data = {
				total_data: rankResult.length,
				items: rankResult.map(it => ({
					...it,
					no: it.index
				})),
				tanggal
			}

			const templateFullPath = path.join(process.cwd(), 'doc-template', 'perangkingan.docx')
			const buffer = await new Promise((resolve, reject) => {
				carbone.render(templateFullPath, data, function(err, result){
				  if (err) {
				    reject(err);
				  }
				  // write the result
				  resolve(result);
				});
			});
			const filename = 'laporan-perangkingan.docx';

			reply
				.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
				.header('Content-Disposition', `attachment;filename="${filename}"`)
				.send(buffer);
    }
	})

}