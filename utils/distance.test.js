/** tests for calulating distance between coordinates */

const { getDistance } = require('../utils/distance');

describe('getDistance utility function', () => {
    test('correctly calculates distance between two locations (same point)', () => {

        const distance = getDistance(0, 0, 0, 0); // same coordinates
        expect(distance).toBe(0);
    });

    test('correctly calculates distance between two valid cities', () => {

        const distance = getDistance(34.0522, -118.2437, 40.7128, -74.0060); // LA to NY
        expect(distance).toBeCloseTo(3935.74, 0); // approximate distance in km
    });

    test('correctly handles negative coordinate values', () => {
        const distance = getDistance(-34.6037, -58.3816, -22.9068, -43.1729); // buenos aires -> rio de janeorp
        expect(distance).toBeCloseTo(1968, 0); // approximate
    });
});

