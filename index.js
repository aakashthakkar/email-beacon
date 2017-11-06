const express = require('express');
const app = express();

const beaconApiRoutes = require('./routes/beaconApiRoutes').beaconApi;
app.use('/', beaconApiRoutes);
app.listen(3000, () => {
		console.log('NodeJS emailbeacon is listening on port 3000');
});
