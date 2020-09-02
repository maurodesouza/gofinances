import multer from 'multer';

import path from 'path';
import crypto from 'crypto';

const folderPath = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: folderPath,

  storage: multer.diskStorage({
    destination: folderPath,
    filename(request, file, callback) {
      const filehash = crypto.randomBytes(15).toString('hex');
      const filename = `${filehash}-${file.originalname}`;

      return callback(null, filename);
    },
  }),
};
