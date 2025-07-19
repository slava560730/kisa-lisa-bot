import {IsEmail, IsString} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  public userId: number;

  @IsString()
  public username: string;

  @IsString()
  public firstName: string;

  @IsString()
  public lastName: string;
}
