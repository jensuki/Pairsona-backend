/** tests for saving user uploaded profile image files to supabase bucket */

const supabase = require('./supabase');
const { uploadMock } = require('../routes/mocks/mockSupabase')

jest.mock('../utils/supabase', () => require('../routes/mocks/mockSupabase'));

describe('Supabase utility funcs', () => {
    afterEach(() => {
        jest.clearAllMocks(); // clear mocks after each test
    });

    test('successfully uploads a file to the Supabase bucket', async () => {
        // simulate a valid file buffer + metadata
        const fileBuffer = Buffer.from('mock-file-data');
        const fileName = 'test-image.jpg';
        const contentType = 'image/jpeg';

        // upload image file to bucket with proper path
        const { data, error } = await supabase.storage
            .from('profile_pics')
            .upload(`public/${Date.now()}-${fileName}`, fileBuffer, {
                contentType,
            });

        expect(data).toEqual({ path: 'mocked/path/to/profile_pic.jpg' });
        expect(error).toBeNull();

        // verify that the mock upload function was called correctly
        expect(uploadMock).toHaveBeenCalledWith(
            // expect end of filename to be in image path
            expect.stringMatching(/test-image.jpg$/),
            fileBuffer,
            { contentType },
        );

    });
})