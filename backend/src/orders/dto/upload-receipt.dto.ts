import { IsString, MaxLength, MinLength } from 'class-validator';

export class UploadReceiptDto {
  /** Path returned by `POST /api/upload`, e.g. `/uploads/<file>.jpg`. */
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  readonly paymentReceipt!: string;
}
