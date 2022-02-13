const { createApp } = require('./app');

const app = createApp();

app.listen(5000, (err, address) => {
	if (err) {
    console.log(err);
		process.exit(1);
	}
	console.log(`listening at address: ${address}`);
	app.blipp();
})
