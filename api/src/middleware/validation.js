const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const { AppError } = require('./errorHandler');

function validateSchema(schema) {
    const validate = ajv.compile(schema);

    return (req, res, next) => {
        const valid = validate(req.body);
        if (!valid) {
            const errors = validate.errors.map(error => ({
                field: error.instancePath,
                message: error.message
            }));

            throw new AppError(400, 'Validation failed', errors);
        }
        next();
    };
}

module.exports = {
    validateSchema
};
