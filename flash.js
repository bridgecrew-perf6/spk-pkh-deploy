const fp = require('fastify-plugin');

module.exports = fp(async (fastify) => {

	fastify.decorateRequest('sflash', function (key, value) {
		this.session[key] = value;
	})

	fastify.decorateRequest('gflash', function (key) {
		const result = this.session[key];
		console.log(`key = ${key}`)
		console.log(`result = ${result}`)
		delete this.session[key];
		return result;
	})

})