import { Request } from 'express';
import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// __dirname no existe en ES Modules, así que lo construimos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta donde se guardan las imágenes: <raíz del proyecto>/public/img
export const RUTA_IMAGENES = path.join(__dirname, '../../public/img');

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/jpg'];

// 1) Filtro: rechaza todo lo que no sea JPG/PNG
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
): void => {
    if (TIPOS_PERMITIDOS.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos JPEG, PNG y JPG'));
    }
};

// 2) Almacenamiento en disco: dónde y con qué nombre se guarda
const storage: StorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(RUTA_IMAGENES)) {
            fs.mkdirSync(RUTA_IMAGENES, { recursive: true });
        }
        cb(null, RUTA_IMAGENES);
    },
    filename: (req, file, cb) => {
        // Nombre único: 1730000000000-123456789.png (evita que se pisen archivos)
        const sufijo = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = file.mimetype.replace('image/', '.');
        cb(null, `${sufijo}${extension}`);
    }
});

// 3) Instancia final. El campo del formulario DEBE llamarse "imagen"
export const uploadImagen = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
}).single('imagen');
