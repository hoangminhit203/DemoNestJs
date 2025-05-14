import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authuSerice: AuthService) {
    super();
  }

  // login gán người vào req thực hiện trong hàm này
  //lấy thông tin người dùng
  async validate(username: string, password: string) {
    const user = await this.authuSerice.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('UserName/password Không hợp lệ');
    }
    if (user.isActive == false) {
      throw new BadRequestException('Tài Khoản chưa kích hoạt ');
    }
    return user;
  }
}
