const jsonschema = require('jsonschema');
const { BadRequestError } = require('../config/expressError');

/** helper func for form validation
 *
 * validates req body against json schema and transforms error msgs
 * file automatically bypassed because its part of formData
 */
const validateRequestBody = (body, schema) => {
    const validator = jsonschema.validate(body, schema);
    if (!validator.valid) {
        const errs = validator.errors.map((e) => {
            if (e.property === 'instance.firstName' || e.property === 'instance.lastName') {
                return 'Name fields can only contain letters';
            }
            if (e.property === 'instance.username') {
                return 'Username must be at least 5 characters';
            }
            if (e.property === 'instance.password') {
                return 'Password must be at least 8 characters';
            }
            if (e.property === 'instance.bio') {
                return 'Bio cannot exceed 100 characters';
            }
            return e.stack;
        });

        // throw just first error
        throw new BadRequestError(errs[0]);
    }

    // validate birthday in req body
    validateBirthDate(body.birthDate)
};

/** helper function to validate birthDate
 *
 * ensures the date is not in the future and the user is at least 18 years old.
 */
const validateBirthDate = (birthDate) => {
    if (birthDate) {
        const today = new Date();
        const minValidDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()); // at least 18 yo
        const earliestAllowedDate = new Date('1930-01-01'); // earliest allowable birth date
        const dateToValidate = new Date(birthDate);

        if (isNaN(dateToValidate.getTime())) {
            throw new BadRequestError('Please enter a valid date');
        }

        if (dateToValidate > today) {
            throw new BadRequestError('Date cannot be in the future');
        }

        if (dateToValidate > minValidDate) {
            throw new BadRequestError('You must be at least 18 years old');
        }

        if (dateToValidate < earliestAllowedDate) {
            throw new BadRequestError('Birth date cannot be earlier than January 1, 1930');
        }
    }
};


module.exports = { validateRequestBody };
