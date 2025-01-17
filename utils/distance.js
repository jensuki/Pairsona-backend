'use strict';

// func to calculate distance between 2 lat/long coordinates in km
// finds compatible matches that are closest in geographical proximity to curr user
// reference: https://stackoverflow.com/questions/365826/calculate-distance-between-2-gps-coordinates

const getDistance = (lat1, lon1, lat2, lon2) => {

    const earthRadius = 6371 // earths radius in km
    const toRadians = (degrees) => degrees * (Math.PI / 180); // convert deg to radians

    const dLat = toRadians(lat2 - lat1);
    const dLong = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
}

module.exports = { getDistance };