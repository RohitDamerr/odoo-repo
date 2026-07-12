const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TransitOps API',
            version: '1.0.0',
            description: 'Smart Transport Operations Platform — Vehicle, Driver, Dispatch, Maintenance, and Expense Management'
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/modules/**/*.routes.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
