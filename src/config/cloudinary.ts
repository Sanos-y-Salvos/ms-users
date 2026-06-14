// SDK de Cloudinary (v2) para subir/eliminar imágenes
import { v2 as cloudinary } from 'cloudinary';
// Carga variables de entorno
import dotenv from 'dotenv';
dotenv.config();

// Configura el cliente con credenciales desde .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Exporta el cliente ya configurado
export default cloudinary;
