// mock geocoding data to prevent real api calls in tests
const geocodeLocation = jest.fn((location) => {
    const mockLocations = {
        'New York': { latitude: 40.7128, longitude: -74.0060 },
        'Los Angeles': { latitude: 34.0522, longitude: -118.2437 },
        'San Francisco': { latitude: 37.7749, longitude: -122.4194 },
        'Houston': { latitude: 29.7601, longitude: -95.3701 },
        'Chicago': { latitude: 41.8781, longitude: -87.6298 }
    };

    if (mockLocations[location]) {
        return Promise.resolve(mockLocations[location]);
    }

    return Promise.reject(new Error(`Mock geocode: Unknown location ${location}`));
});

module.exports = { geocodeLocation };
