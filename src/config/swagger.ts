// Generador de spec OpenAPI a partir de comentarios JSDoc en rutas
import swaggerJsdoc from 'swagger-jsdoc';

// Opciones de configuración para swagger-jsdoc
const options: swaggerJsdoc.Options = {
  definition: {
    // Versión del estándar OpenAPI
    openapi: '3.0.0',
    // Metadatos visibles en la UI
    info: {
      title: 'MS-Users — Sanos y Salvos',
      version: '2.0.0',
      description: 'Microservicio de gestión de usuarios: registro de ciudadanos e instituciones, perfil, gestión de contraseñas (cambio y recuperación por OTP) y administración. Fuente de verdad de los datos del usuario.',
    },
    // Servidor por defecto para "Try it out"
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Servidor de desarrollo',
      },
    ],
    // Esquema de seguridad: JWT vía Bearer
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Archivos donde swagger-jsdoc busca anotaciones (compilados en prod, fuentes en dev)
  apis: process.env.NODE_ENV === 'production'
    ? ['./dist/routes/*.js']
    : ['./src/routes/*.ts'],
};

// Exporta el spec listo para servir
export default swaggerJsdoc(options);
