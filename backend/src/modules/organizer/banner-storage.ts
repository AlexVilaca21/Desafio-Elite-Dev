import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { Options, diskStorage } from 'multer';
import { extname, join } from 'path';

export const BANNERS_DIR = join(process.cwd(), 'uploads', 'banners');
export const BANNER_PREFIX = '/uploads/banners/';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

mkdirSync(BANNERS_DIR, { recursive: true });

export const bannerMulterOptions: Options = {
  storage: diskStorage({
    destination: BANNERS_DIR,
    filename: (_req, file, callback) => {
      const ext = extname(file.originalname).toLowerCase();
      const safeExt = ALLOWED_EXT.has(ext) ? ext : '.jpg';
      callback(null, `${randomUUID()}${safeExt}`);
    },
  }),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      callback(new BadRequestException('O banner deve ser JPG, PNG ou WEBP'));
      return;
    }

    callback(null, true);
  },
};

export function bannerPublicPath(filename: string): string {
  return `${BANNER_PREFIX}${filename}`;
}

export function removeLocalBanner(imageUrl?: string | null): void {
  if (!imageUrl?.startsWith(BANNER_PREFIX)) {
    return;
  }

  const filePath = join(BANNERS_DIR, imageUrl.slice(BANNER_PREFIX.length));

  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}
