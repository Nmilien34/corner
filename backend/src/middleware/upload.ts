import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TMP_DIR = path.join(__dirname, '../../tmp/uploads');

export const upload = multer({
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB (audio files)
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TMP_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
});
