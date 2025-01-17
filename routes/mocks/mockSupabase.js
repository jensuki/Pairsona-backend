/** mock uploading profile images to supabase */

let uploadMock = jest.fn(() => {
    return {
        data: { path: 'mocked/path/to/profile_pic.jpg' }, // default mocked path
        error: null,
    };
});

const mockSupabase = {
    storage: {
        from: jest.fn(() => ({
            upload: uploadMock, // use the dynamic mock
        })),
    },
};

// export the mock and the uploadMock for individual test overrides
module.exports = mockSupabase;
module.exports.uploadMock = uploadMock;
