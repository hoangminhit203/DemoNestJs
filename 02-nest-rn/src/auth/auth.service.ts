import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { comparePasswordHelper } from '@/helpers/util';
import { JwtService } from '@nestjs/jwt';
import {
  ChangePasswordAuthDto,
  CodeAuthDto,
  CreateAuthDto,
} from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService, // Inject UsersService để thao tác với người dùng
    private jwtService: JwtService, // Inject JwtService để tạo JWT token
  ) {}

  /**
   * Hàm đăng nhập người dùng
   * @param username - Tên đăng nhập (email)
   * @param pass - Mật khẩu người dùng
   * @returns access_token nếu đăng nhập thành công
   */

  async validateUser(username: string, pass: string): Promise<any> {
    // Tìm người dùng theo email
    const user = await this.userService.findByEmail(username);
    // neu ko co nguoi dung return null
    if (!user) return null;
    // So sánh mật khẩu nhập vào với mật khẩu đã hash trong database
    const isValidPassword = await comparePasswordHelper(pass, user.password);

    // Nếu mật khẩu không đúng, ném ra lỗi Unauthorized
    if (!isValidPassword) return null;
    return user;
  }
  // any bất cứ khi nào
  async login(user: any) {
    // bởi database của mình là id và email
    const payload = { username: user.email, sub: user._id };
    return {
      user: {
        email: user.email,
        _id: user._id,
        name: user.name,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  handleRegister = async (registerDto: CreateAuthDto) => {
    return await this.userService.handleRegister(registerDto);
  };
  checkCode = async (data: CodeAuthDto) => {
    return await this.userService.handleActive(data);
  };
  retryActive = async (data: string) => {
    return await this.userService.retryActive(data);
  };

  retryPassword = async (data: string) => {
    return await this.userService.retryPassword(data);
  };

  changePassword = async (data: ChangePasswordAuthDto) => {
    return await this.userService.changePassword(data);
  };
}
