const Auth = require('./auth');
const { db } = require('../db')

const App = async (fastify) => {
	fastify.get('/', async (request, reply) => {
		const aktifPeriode = await db.periode.findFirst({ where: { aktif: true } })
		const totalPenerimaBantuan = await db.penerimaBantuan.count()

		let totalDiterima = 0;
		let totalDitolak = 0;
		let totalDraft = 0;

		const kriterias = await db.kriteria.findMany({  });
		let kriteriaAggs = [];
		for (let kriteria of kriterias) {
			const aggs = await db.$queryRaw`
					SELECT subk.id, subk.nama, COUNT(pen.subkriteriaId) as total 
						FROM \`Penilaian\` as pen 
						JOIN Subkriteria as subk ON pen.subkriteriaId = subk.id
					    JOIN Kriteria as k ON subk.kriteriaId = k.id
					    WHERE k.id = ${kriteria.id} AND pen.periodeId = ${aktifPeriode.id}
					    GROUP BY pen.subkriteriaId
			`;
			kriteriaAggs.push({
				id: kriteria.id,
				label: kriteria.nama,
				aggs
			})
		}

		reply.view('app/dashboard', {
			title: 'SPK Penentuan Penerima Bantuan PKH',
			session: request.session,
			aktifPeriode,
			totalPenerimaBantuan,
			totalDitolak,
			totalDiterima,
			totalDraft,
			kriteriaAggs
		});
	});

	fastify.register(require('./kriteria'), { prefix: '/kriteria' });
	fastify.register(require('./subkriteria'), { prefix: '/subkriteria' });
	// fastify.register(require('./mahasiswa'), { prefix: '/mahasiswa' });
	fastify.register(require('./rank'), { prefix: '/rank' })
	fastify.register(require('./periode'), { prefix: '/periode' })
	fastify.register(require('./penerima-bantuan'), { prefix: '/penerima-bantuan' })
	fastify.register(require('./penilaian'), { prefix: '/penilaian' })

	fastify.register(require('./penerima/user-penerima'), { prefix: '/penerima/me' })
}

module.exports = async (fastify) => {

	fastify.get('/', async (request, reply) => {
		reply.view('landing/index')
	})

	fastify.register(Auth, { prefix: '/auth' })
	fastify.register(App, { prefix: '/app' })

}