// Importa Express y el tipo Application
import express, { Application } from 'express';
// Middleware para habilitar CORS
import cors from 'cors';
// Logger HTTP para desarrollo
import morgan from 'morgan';
// UI de Swagger para documentación interactiva
import swaggerUi from 'swagger-ui-express';
// Especificación OpenAPI generada
import swaggerSpec from './config/swagger';
// Rutas del recurso usuarios
import userRoutes from './routes/user.routes';
// Middleware para rutas no encontradas
import { notFound } from './middlewares/notFound';
// Middleware central de manejo de errores
import { errorHandler } from './middlewares/errorHandler';

// Instancia principal de Express
const app: Application = express();

// Habilita CORS para todos los orígenes
app.use(cors());
// Activa logging de peticiones HTTP en consola
app.use(morgan('dev'));
// Parser de cuerpos JSON
app.use(express.json());
// Parser de cuerpos URL-encoded (formularios)
app.use(express.urlencoded({ extended: true }));

// Monta la documentación Swagger en /api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Endpoint raíz de salud para verificar que el servicio está activo
app.get('/', (_req, res) => {
  // Responde con un mensaje de estado operativo
  res.json({ message: 'MS-Users operativo ✅' });
});

// Monta las rutas de usuarios bajo /api/users
app.use('/api/users', userRoutes);

// Middleware 404 para rutas inexistentes
app.use(notFound);
// Middleware final para capturar errores no controlados
app.use(errorHandler);

// Exporta la app para que server.ts la inicie
export default app;
