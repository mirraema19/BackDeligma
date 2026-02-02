import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de almacenamiento para imágenes del muro de la fama
const storageMuroFama = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/muro_fama'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'muro-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configuración de almacenamiento para revistas (imágenes y PDFs)
const storageRevistas = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/revistas'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'imagen_portada' ? 'portada-' : 'revista-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para validar tipos de archivo de imágenes
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF, WEBP)'));
  }
};

// Filtro para validar tipos de archivo de revistas (imágenes y PDFs)
const revistaFileFilter = (req, file, cb) => {
  if (file.fieldname === 'imagen_portada') {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('La portada debe ser una imagen (JPEG, JPG, PNG, WEBP)'));
    }
  } else if (file.fieldname === 'archivo_pdf') {
    const isPdf = path.extname(file.originalname).toLowerCase() === '.pdf';
    const mimetype = file.mimetype === 'application/pdf';

    if (mimetype && isPdf) {
      return cb(null, true);
    } else {
      cb(new Error('El archivo debe ser un PDF'));
    }
  } else {
    cb(new Error('Campo de archivo no válido'));
  }
};

// Configuración de tamaño máximo de archivo (5MB por defecto)
const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

// Middleware para subir imágenes del muro de la fama
export const uploadMuroFama = multer({
  storage: storageMuroFama,
  fileFilter: imageFileFilter,
  limits: { fileSize: maxSize }
}).single('imagen');

// Middleware para subir archivos de revistas (portada e PDF)
export const uploadRevista = multer({
  storage: storageRevistas,
  fileFilter: revistaFileFilter,
  limits: { fileSize: maxSize }
}).fields([
  { name: 'imagen_portada', maxCount: 1 },
  { name: 'archivo_pdf', maxCount: 1 }
]);

// Middleware para manejar errores de multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `El archivo es demasiado grande. Tamaño máximo: ${maxSize / (1024 * 1024)}MB`
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Error al subir el archivo',
      error: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};
