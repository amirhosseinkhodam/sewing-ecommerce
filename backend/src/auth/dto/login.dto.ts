import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^09\d{9}$/, {
    message: 'phone must be a valid Iranian mobile number',
  })
  readonly phone: string;

  @IsString()
  @MinLength(8)
  readonly password: string;
}
