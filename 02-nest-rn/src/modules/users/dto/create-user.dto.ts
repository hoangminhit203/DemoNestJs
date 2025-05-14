import { IsEmail, IsEmpty, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  // có thể custom lại mess
  @IsNotEmpty({ message: 'Không được để trống' })
  name: string;
  @IsNotEmpty()
  @IsEmail({}, { message: 'Ivalid email message' })
  email: string;
  @IsNotEmpty({ message: 'Password Không được để trống' })
  password: string;

  phone: string;
  address: string;
  image: string;
}
