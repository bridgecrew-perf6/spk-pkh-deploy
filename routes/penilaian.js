const { upload } = require('../uploads')
const { db } = require('../db');
const _ = require('lodash')

module.exports = async (fastify) => {
  
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

      const kriteriaList = await db.kriteria.findMany({
        include: {
          subs: true
        },
        orderBy: {
          bobot: 'desc'
        }
      })

      let items = await db.penerimaBantuan.findMany({
        include: {
          penilaians: {
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
              },
              periode: true
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
      items = items.map(it => {
        const { penilaians, ...rest } = it
        let vals = {}
        penilaians.forEach(p => {
          vals[p.subkriteria.kriteriaId] = p.subkriteria.nama
        })
        return {
          ...rest,
          vals
        }
      })

      reply.view('app/penilaian/list', {
        title: 'Data Penilaian',
				subtitle: 'Daftar Penilaian Penerima Bantuan',
				session: request.session,
        periode,
        items,
        kriteriaList,
        periodeList,
        VUE_DATA: {
          periodeList,
          periode,
          kriteriaList,
          items,
        }
      })
    }
  })

  fastify.get('/create', {
    handler: async (request, reply) => {
      const aktifPeriode = await db.periode.findFirst({
        where: {
          aktif: true
        }
      })
      const periodeList = await db.periode.findMany({})

      const kriteriaList = await db.kriteria.findMany({
        include: {
          subs: true
        },
        orderBy: {
          'bobot': 'desc'
        }
      })

      const penerimaBantuanList = await db.penerimaBantuan.findMany({
        where: {
          penilaians: {
            every: {
              NOT: {
                periodeId: aktifPeriode.id
              }
            }
          }
        }
      })

      return reply.view('app/penilaian/create', {
        title: 'Data Penilaian',
				subtitle: 'Tambah Penilaian Penerima Bantuan',
				session: request.session,
        penerimaBantuanList,
        periodeList,
        aktifPeriode,
        kriteriaList
      })
    }
  })

  fastify.post('/create', {
    preHandler: upload.none(),
    handler: async (request, reply) => {
      let { penerimaBantuanId, periodeId, ...rest } = request.body
      penerimaBantuanId = parseInt(penerimaBantuanId)
      periodeId = parseInt(periodeId)
      let penilaianList = []
      Object.keys(rest).forEach(k => {
        penilaianList.push({
          penerimaBantuanId,
          periodeId,
          subkriteriaId: parseInt(rest[k])
        })
      })
      await db.penilaian.createMany({
        data: penilaianList
      })
      reply.redirect('/app/penilaian')
    }
  })
  
}