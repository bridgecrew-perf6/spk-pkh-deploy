const _ = require('lodash')
const { db } = require('../db')

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

			let kriterias = await db.kriteria.findMany({})
			kriterias = _.sortBy(kriterias, it => it.id)
			const profileTargets = kriterias.map(it => it.target)
			const bobots = kriterias.map(it => it.bobot / 100.0)
			const types = kriterias.map(it => it.core)
			const n_core = types.filter(it => it).length;
			const n_secondary = types.length - n_core;

			let penerimaBantuanList = await db.penerimaBantuan.findMany({
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

			penerimaBantuanList = penerimaBantuanList
				.filter(it => it.penilaians.length == kriterias.length)

			const alts = penerimaBantuanList.map(m => {
				let penilaians = m.penilaians;
				penilaians = _.sortBy(penilaians, it => it.subkriteria.kriteria.id)
				const xs = penilaians.map(it => {
					return it.subkriteria.bobot;
				})
				return xs
			})

			const gapDifference = alts.map(row => {
				return row.map((x, i) => x - profileTargets[i])
			})

			const gapMapped = gapDifference.map(row => {
				return row.map((x, i) => mapGap(x))
			})

			const CS_vals = gapMapped.map(row => {
				const xsCore = row.filter((x, i) => types[i]);
				const xsSecondary = row.filter((x, i) => !types[i]);
				const tc = xsCore.reduce((a, b) => a + b, 0) / n_core;
				const ts = xsSecondary.reduce((a, b) => a + b, 0) / n_secondary;

				// const ws = [0.15,	0.15,	0.15,	0.1,	0.1,	0.1,	0.1,	0.1,	0.05]
				// const s = _.range(gapMapped.length).map(i => {
				// 	const tncf = (tc * ws[0]) + (tc * ws[1]) + (tc * ws[2])
				// 	const tnsf = (ts * ws[3]) + (ts * ws[4]) + (ts * ws[5]) + (ts * ws[6]) + (ts * ws[7]) + (ts * ws[8])
				// 	return (0.75 * tncf) + (0.25 * tnsf)
				// })

				return { tc, ts }
			})

			const totalVals = CS_vals.map(pack => {
				const ntcf = bobots
					.map((b, i) => ({
						weight: b,
						core: types[i]
					}))
					.filter(it => it.core)
					.map(it => it.weight * pack.tc)
					.reduce((a, b) => a + b, 0)
				const ntsf = bobots
					.map((b, i) => ({
						weight: b,
						core: types[i]
					}))
					.filter(it => !it.core)
					.map(it => it.weight * pack.ts)
					.reduce((a, b) => a + b, 0)
				return (0.75 * ntcf) + (ntsf * 0.25)
			})

			let items = penerimaBantuanList.map((m, i) => {
				return {
					...m,
					pm_value: totalVals[i]
				}
			})

			const itemsSorted = _.reverse(_.sortBy(items, it => it.pm_value))
			items = itemsSorted.map((it, index) => {
				return {
					...it,
					index: index + 1
				}
			})

			reply.view('app/rank-result', {
				title: 'Data Perangkingan',
				subtitle: 'Daftar Penerima Bantuan',
				session: request.session,
				VUE_DATA: {
					items: items,
					periode,
					periodeList
				}
			})
		}
	})

}