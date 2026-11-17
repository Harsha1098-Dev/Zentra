import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'logos');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveLogo(
    organizationId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Invalid image format. Allowed formats: JPEG, PNG, WebP, SVG',
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Image size exceeds maximum limit of 5MB');
    }

    // Determine extension
    const ext = path.extname(file.originalname) || '.png';
    const randomHash = crypto.randomBytes(8).toString('hex');
    const filename = `logo-${organizationId}-${Date.now()}-${randomHash}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filePath, file.buffer);

    const apiBaseUrl =
      this.configService.get<string>('API_BASE_URL') || 'http://localhost:4000';
    return `${apiBaseUrl}/uploads/logos/${filename}`;
  }

  async deleteLogo(logoUrl: string): Promise<void> {
    if (!logoUrl) return;

    try {
      const parts = logoUrl.split('/uploads/logos/');
      if (parts.length === 2) {
        const filename = parts[1];
        const filePath = path.join(this.uploadDir, filename);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not delete logo file: ${err.message}`);
    }
  }
}
