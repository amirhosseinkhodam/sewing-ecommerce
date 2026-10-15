import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  readonly name: string;

  @IsString()
  @Matches(/^09\d{9}$/, {
    message: 'phone must be a valid Iranian mobile number',
  })
  readonly phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  readonly message: string;
}
