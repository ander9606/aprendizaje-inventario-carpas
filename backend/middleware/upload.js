// ============================================
// MIDDLEWARE: Upload de imágenes
// Configuración compartida de multer
// ============================================

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AppError = require('../utils/AppError');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Crea una instancia de multer para una carpeta específica
 * @param {string} folder - Subcarpeta dentro de uploads (ej: 'elementos', 'productos')
 */
function createUpload(folder) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(__dirname, '../uploads', folder);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const id = req.params.id || 'temp';
      const ext = path.extname(file.originalname).toLowerCase();
      const timestamp = Date.now();
      cb(null, `${folder.slice(0, -1)}_${id}_${timestamp}${ext}`);
    }
  });

  const fileFilter = (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Solo se permiten imágenes (JPEG, PNG, WebP)', 400), false);
    }
  };

  return multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } }).single('imagen');
}

/**
 * Elimina un archivo de imagen del sistema de archivos
 * @param {string} relativePath - Ruta relativa (ej: /uploads/elementos/elemento_1_123.jpg)
 */
function deleteImageFile(relativePath) {
  if (!relativePath) return;
  const filePath = path.join(__dirname, '..', relativePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = {
  uploadElementoImagen: createUpload('elementos'),
  uploadProductoImagen: createUpload('productos'),
  uploadOperacionImagen: createUpload('operaciones'),
  createUpload,
  deleteImageFile
};
