import swaggerJsdoc, { Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gestion École API',
      version: '1.0.0',
      description: `
        API pour la gestion de l'école avec système d'authentification complet.

        
      `,
      contact: {
        name: 'Support API',
        email: 'support@gestion-ecole.com'
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'https://ejomi.edutrackhub.cloud',
        description: 'Serveur de production',
      },
      {
        url: 'http://localhost:3001',
        description: 'Serveur de développement local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // Format du token
        },
      },
    },
    security: [
      {
        bearerAuth: [], // Applique la sécurité par défaut à toutes les routes
      },
    ],
  },
  apis: [
    'src/Routes/*.route.ts',
    'src/Routes/*.ts',
    './src/Routes/**/*.ts'
  ], // Chemin vers vos fichiers de routes
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Configure Swagger pour l'application Express.
 * @param app - Instance de l'application Express
 */
const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;