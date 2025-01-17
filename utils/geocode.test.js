/** test for geocoding location */

jest.mock("../utils/geocode", () => ({
    // import module
    ...jest.requireActual("../utils/geocode"),
    // mock only geocodeLocation
    geocodeLocation: jest.fn(),
}));

const { geocodeLocation } = require("../utils/geocode");

describe('geocodeLocation utility func', () => {
    afterEach(() => {
        jest.clearAllMocks(); // clear mocks after each test
    });

    test('correctly returns latitude and longitude for a valid location', async () => {
        // mock
        geocodeLocation.mockResolvedValue({ latitude: 34.0522, longitude: -118.2437 });

        const location = 'Los Angeles';
        const result = await geocodeLocation(location);

        // verify the mocked implementation was used
        expect(result).toEqual({ latitude: 34.0522, longitude: -118.2437 });
        expect(geocodeLocation).toHaveBeenCalledWith(location);
    });

    test("throws an error for an invalid location", async () => {
        // mock throwing an error or invalid loction
        geocodeLocation.mockRejectedValue(new Error("Invalid location"));

        const location = "Invalid Location";

        await expect(geocodeLocation(location)).rejects.toThrow("Invalid location");
        expect(geocodeLocation).toHaveBeenCalledWith(location);
    });
});
