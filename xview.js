const fp = require('fastify-plugin')
const { store } = require('./session-store');

module.exports = fp(async (fastify) => {
	fastify.decorateReply('xview', function (path, data) {
		const user = store.get('user');
		const mahasiswa = store.get('mahasiswa');
		console.log('user')
		console.log(user)
		return this.view(path, {
			...data,
			session: {
				user,
				mahasiswa
			}
		}) 
	})
})