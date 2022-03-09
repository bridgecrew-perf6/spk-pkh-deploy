const { createApp } = require('./app');

const app = createApp();
const port = process.env.PORT | 8080;

app.listen(port, (err, address) => {
	if (err) {
    console.log(err);
		process.exit(1);
	}
	console.log(`listening at address: ${address}`);
	app.blipp();
})
