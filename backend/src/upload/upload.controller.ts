import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const storage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
  },
});

const uploadOptions = {
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, accept: boolean) => void,
  ) => {
    const valid =
      ALLOWED_MIME_TYPES.has(file.mimetype) &&
      ALLOWED_EXTENSIONS.has(extname(file.originalname).toLowerCase());
    cb(
      valid
        ? null
        : new BadRequestException(
            'Only JPEG, PNG, WebP or GIF images are allowed',
          ),
      valid,
    );
  },
};

@ApiTags('upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      return { url: null };
    }
    return { url: `/uploads/${file.filename}` };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10, uploadOptions))
  uploadMultiple(@UploadedFiles() files?: Express.Multer.File[]) {
    return { urls: (files ?? []).map((file) => `/uploads/${file.filename}`) };
  }
}
