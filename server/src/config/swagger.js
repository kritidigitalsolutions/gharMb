const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GHARMB Platform API',
      version: '1.0.0',
      description: 'API documentation for the GHARMB platform (App Client and Admin Panel)',
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/**/*.js').replace(/\\/g, '/'),
    path.join(__dirname, '../models/**/*.js').replace(/\\/g, '/'),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
