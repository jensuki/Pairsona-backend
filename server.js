'use strict';

/** starting up server for pairsona */

const app = require('./app');

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});