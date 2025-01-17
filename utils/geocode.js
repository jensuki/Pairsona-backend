'use strict';

const axios = require('axios');

const OPENCAGE_API_URL = process.env.OPENCAGE_API_URL;
const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;

/** get latitude + longitude for a given user location */

const geocodeLocation = async (location) => {
    try {
        console.log('Real geocodeLocation called'); // debug to track api calls if made
        const res = await axios.get(OPENCAGE_API_URL, {
            params: {
                q: location,
                key: OPENCAGE_API_KEY
            }
        });

        const data = res.data;

        // check if results are availble
        if (data.results.length === 0) {
            throw new Error('Invalid location');
        }

        // extract lat and long
        const { lat, lng } = data.results[0].geometry;
        return { latitude: lat, longitude: lng };
    } catch (err) {
        console.error('Error geocoding location:', err.message);
        throw err;
    }
}

module.exports = { geocodeLocation };