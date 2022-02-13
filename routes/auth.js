const bcrypt = require('bcrypt');
const { upload } = require('../uploads')
const { db } = require('../db');

module.exports = async (fastify) => {

	fastify.get('/signup-admin', async (request, reply) => {
		reply.view('auth/signup-admin', {
		});
	});

	fastify.post('/signup-admin', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			const { username, password } = request.body;
			const hashedPassword = await bcrypt.hash(password, 4);
			const admin = await db.user.create({
				data: {
					username,
					password: hashedPassword,
					role: 'ADMIN'
				}
			})
			reply.redirect('/auth/login');
		}
	});

	fastify.get('/signup-penerima', async (request, reply) => {
		reply.view('auth/signup-penerima', {
		});
	});

	fastify.post('/signup-penerima', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			const { username, password } = request.body;
			const hashedPassword = await bcrypt.hash(password, 4);
			const admin = await db.user.create({
				data: {
					username,
					password: hashedPassword,
					role: 'PENERIMA'
				}
			})
			reply.redirect('/auth/login');
		}
	});

	fastify.get('/login', {
		handler: async (request, reply) => {
			const err_username = request.gflash('err_username');
			const err_password = request.gflash('err_password');
			reply.view('auth/login', {
				err_username,
				err_password
			});
		}
	})

	fastify.post('/login', {
		preHandler: upload.none(),
		handler: async (request, reply) => {
			const payload = request.body;
			// Find user
			const { username, password } = payload;
			const user = await db.user.findFirst({
				where: { username }
			})
			if (!user) {
				request.sflash('err_username', 'User tidak dapat ditemukan');
				reply.redirect('/auth/login');
				return;
			}

			const passwordMatch = await bcrypt.compare(password, user.password);
			if (!passwordMatch) {
				request.sflash('err_password', 'Password tidak cocok');
				reply.redirect('/auth/login');
				return;
			}

			let penerimaBantuan = null;
			if (user.role == 'PENERIMA' && user.penerimaBantuanId) {
				penerimaBantuan = await db.penerimaBantuan.findFirst({
					where: {
						id: user.penerimaBantuanId
					}
				})
			}
			request.session.user = user;
			request.session.penerimaBantuan = penerimaBantuan;

			reply.redirect('/app');
		}
	})

	fastify.get('/logout', {
		handler: async (request, reply) => {
			request.destroySession(() => {
				reply.redirect('/auth/login')
			})
		}
	})
}