'use strict';

/** tests for partial update using sqlForPartialUpdate helper func  */

const { sqlForPartialUpdate } = require('../helpers/sql');
const { BadRequestError } = require('../config/expressError');

describe('sqlForPartialUpdate', () => {
    test('generates correct SQL and values for a partial update', () => {
        const dataToUpdate = {
            firstName: 'Updated',
            lastName: 'User',
            bio: 'Updated bio' // data to be updated
        };

        // js to sql column mappings
        const jsToSql = {
            firstName: 'first_name',
            lastName: 'last_name',
            bio: 'bio'
        };

        // call the helper func
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        // verify that returned setCols and values match expectations
        expect(result).toEqual({
            setCols: '"first_name"=$1, "last_name"=$2, "bio"=$3',
            values: ['Updated', 'User', 'Updated bio']
        });
    });

    test('works with a single field update', () => {
        const dataToUpdate = {
            bio: 'Updated bio' // only one field to update
        };

        const jsToSql = {
            bio: 'bio' // mapping for the field
        };

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        // verify sql and values for single field update
        expect(result).toEqual({
            setCols: '"bio"=$1',
            values: ['Updated bio']
        });
    });

    test('throws BadRequestError if no data is provided', () => {
        const dataToUpdate = {}; // no field to update

        const jsToSql = {
            firstName: 'first_name',
            lastName: 'last_name',
            bio: 'bio'
        };

        // call helper func and expect error
        expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql))
            .toThrow(BadRequestError);
    });

    test('handles keys not mapped in jsToSql and should default to original name', () => {
        const dataToUpdate = {
            firstName: 'Updated', // mapped key
            location: 'New York' // unmapped key
        };

        const jsToSql = {
            firstName: 'first_name' // only one mapped field
            // location not included in this mapping
        };

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(result).toEqual({
            setCols: '"first_name"=$1, "location"=$2',
            values: ['Updated', 'New York'] // defaults back original key
        });
    });
});
