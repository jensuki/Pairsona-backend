'use strict';

/** starting up server for pairsona */

const app = require('./app');
const port = process.env.PORT || 3001;

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});