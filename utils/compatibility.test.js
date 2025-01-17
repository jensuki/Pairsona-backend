/** tests to verify mbti compatibilities */

const { getCompatibilityTypes, isValidMbtiType } = require('../utils/compatibility');


describe('MBTI compatibility utility functions', () => {

    describe('getCompatibilityTypes', () => {
        test('returns correct compatible types for a valid MBTI type', () => {

            const result = getCompatibilityTypes('INFJ');

            expect(result).toEqual(["ENFP", "ENTP"]); // compatible mbtis
        });

        test('returns an empty array for an invalid mbti type', () => {

            const result = getCompatibilityTypes('INVALID');

            expect(result).toEqual([]); // invalid should return empty array
        });
    });

    describe('isValidMbtiType', () => {
        test('returns true for a valid MBTI type', async () => {
            const result = isValidMbtiType('ESTP');

            expect(result).toBe(true); // valid type returns true
        });

        test('returns false for an invalid  or undefined MBTI type', async () => {
            const invalidType = isValidMbtiType('IMVALID');
            const undefinedType = isValidMbtiType(undefined);

            expect(invalidType).toBe(false);
            expect(undefinedType).toBe(false);
        })
    })
})