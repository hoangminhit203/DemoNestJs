import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { hassPasswordHelper } from '@/helpers/util';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import {
  ChangePasswordAuthDto,
  CodeAuthDto,
  CreateAuthDto,
} from '@/auth/dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
import { use } from 'passport';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private readonly mailerService: MailerService,
  ) {}
  // check email đã tồn tại chưa
  isEmailExits = async (email: string) => {
    const user = await this.userModel.exists({ email });
    // nếu con user tồn tài trả về true ngc lại false
    if (user) return true;
    return false;
  };

  async create(createUserDto: CreateUserDto) {
    try {
      // Lấy các trường cần thiết từ DTO
      const { name, email, password, phone, address, image } = createUserDto;

      // ✅ PHẢI có await để đợi kết quả kiểm tra email (vì hàm isEmailExits là async)
      const isExit = await this.isEmailExits(email);
      if (isExit === true) {
        // Nếu email đã tồn tại, ném lỗi 400 với thông báo cụ thể
        throw new BadRequestException(
          `Email đã tồn tại: ${email}. Vui lòng sử dụng email khác`,
        );
      }

      // Băm mật khẩu người dùng
      const hassPassword = await hassPasswordHelper(password);

      // Tạo user mới với các thông tin đã xử lý
      const user = await this.userModel.create({
        name,
        email,
        password: hassPassword, // mật khẩu đã được mã hoá
        phone,
        address,
        image,
      });

      // Trả về _id khi tạo thành công
      return {
        _id: user._id,
      };
    } catch (error) {
      // Ghi log lỗi chi tiết để dễ debug
      console.error('Lỗi khi tạo user', error);

      // ✅ Nếu lỗi là BadRequestException thì giữ nguyên để controller xử lý
      if (error instanceof BadRequestException) {
        throw error;
      }

      // ❗ Nếu lỗi khác, trả về lỗi 500 với thông báo chung
      throw new InternalServerErrorException(
        'Không thể tạo người dùng. Vui lòng thử lại sau.',
      );
    }
  }
  // cách phân trang pagesize pagenumber
  // cái này được gọi là param đầu vào của api
  // Hàm findAll để lấy danh sách user với phân trang và lọc
  async findAll(query: string, current: number, pageSize: number) {
    // Parse query string thành filter và sort bằng thư viện aqp
    const { filter, sort } = aqp(query);

    // Xóa các tham số phân trang khỏi filter để tránh xung đột
    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;

    // Gán giá trị mặc định cho current (trang hiện tại) và pageSize (số bản ghi mỗi trang)
    const currentPage = current && !isNaN(current) ? +current : 1;
    const pageSizeLimit = pageSize && !isNaN(pageSize) ? +pageSize : 10;

    // Tính tổng số bản ghi phù hợp với filter
    const totalItems = (await this.userModel.find(filter)).length;

    // Tính tổng số trang dựa trên totalItems và pageSize
    const totalPages = Math.ceil(totalItems / pageSizeLimit);

    // Tính số bản ghi cần bỏ qua (skip) để lấy đúng trang
    const skip = (currentPage - 1) * pageSizeLimit;

    // Lấy danh sách bản ghi với filter, phân trang và sort
    const results = await this.userModel
      .find(filter)
      .limit(pageSizeLimit) // Giới hạn số bản ghi mỗi trang
      .skip(skip) // Bỏ qua các bản ghi của các trang trước
      // bảo password ra
      .select('-password')
      .sort(sort as any); // Sắp xếp theo sort từ query

    // Trả về kết quả gồm danh sách bản ghi và tổng số trang
    return {
      meta: {
        current: current, //trang hiện tại
        pageSize: pageSize, //số lượng bản ghi đã lấy
        pages: totalPages, //tổng số trang với điều kiện query
        total: totalItems, // tổng số phần tử (số bản ghi)
      },
      results, //kết quả query
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findByEmail(email: string) {
    // findone nó sẽ return về null
    return await this.userModel.findOne({ email });
  }

  async update(updateUserDto: UpdateUserDto) {
    // hàm updateOne của Mongoose sẻ trả về obj chứ thông tin về hoạt động update
    return await this.userModel.updateOne(
      {
        _id: updateUserDto._id,
      },
      { ...updateUserDto },
    );
  }

  async remove(_id: string) {
    // có 2 cách để làm là viết dto đẻ validate check
    //2 là check trong service
    // check id
    if (mongoose.isValidObjectId(_id)) {
      //delete
      return this.userModel.deleteOne({ _id });
    } else {
      throw new BadRequestException('Id Không đúng định dạng ');
    }
  }

  async handleRegister(registerDto: CreateAuthDto) {
    try {
      // Lấy các trường cần thiết từ DTO
      const { name, email, password } = registerDto;

      // ✅ PHẢI có await để đợi kết quả kiểm tra email (vì hàm isEmailExits là async)
      const isExit = await this.isEmailExits(email);
      if (isExit === true) {
        // Nếu email đã tồn tại, ném lỗi 400 với thông báo cụ thể
        throw new BadRequestException(
          `Email đã tồn tại: ${email}. Vui lòng sử dụng email khác`,
        );
      }

      // Băm mật khẩu người dùng
      const hassPassword = await hassPasswordHelper(password);
      const codeId = uuidv4();
      // Tạo user mới với các thông tin đã xử lý
      const user = await this.userModel.create({
        name,
        email,
        password: hassPassword, // mật khẩu đã được mã hoá
        isActive: false,
        codeId: codeId,
        codeExpired: dayjs().add(5, 'minutes'),
      });
      // send mail
      this.mailerService.sendMail({
        to: user.email, // list of receivers
        //from: 'noreply@nestjs.com', // sender address
        subject: 'Activate Your Account at @DemoTestCode', // Subject line
        template: 'register.hbs',
        context: {
          name: user?.name ?? user.email,
          activationCode: codeId,
        },
      });

      // phản hồi
      return {
        _id: user._id,
      };
    } catch (error) {
      // Ghi log lỗi chi tiết để dễ debug
      console.error('Lỗi khi tạo user', error);

      // ✅ Nếu lỗi là BadRequestException thì giữ nguyên để controller xử lý
      if (error instanceof BadRequestException) {
        throw error;
      }

      // ❗ Nếu lỗi khác, trả về lỗi 500 với thông báo chung
      throw new InternalServerErrorException(
        'Không thể tạo người dùng. Vui lòng thử lại sau.',
      );
    }
  }

  async retryActive(email: string) {
    //check email
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }
    if (user.isActive) {
      throw new BadRequestException('Tài khoản đã được kích hoạt');
    }

    //send Email
    const codeId = uuidv4();

    //update user
    await user.updateOne({
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes'),
    });

    //send email
    this.mailerService.sendMail({
      to: user.email, // list of receivers
      subject: 'Activate your account at @hoidanit', // Subject line
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: codeId,
      },
    });
    return { _id: user._id };
  }

  async handleActive(data: CodeAuthDto) {
    const user = await this.userModel.findOne({
      _id: data._id,
      codeId: data.code,
    });
    if (!user) {
      throw new BadRequestException('Mã code không hợp lệ hoặc đã hết hạn');
    }

    //check expire code
    const isBeforeCheck = dayjs().isBefore(user.codeExpired);

    if (isBeforeCheck) {
      //valid => update user
      await this.userModel.updateOne(
        { _id: data._id },
        {
          isActive: true,
        },
      );
      return { isBeforeCheck };
    } else {
      throw new BadRequestException('Mã code không hợp lệ hoặc đã hết hạn');
    }
  }

  async retryPassword(email: string) {
    //check email
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    //send Email
    const codeId = uuidv4();

    //update user
    await user.updateOne({
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes'),
    });

    //send email
    this.mailerService.sendMail({
      to: user.email, // list of receivers
      subject: 'Change your password account at @hoidanit', // Subject line
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: codeId,
      },
    });
    return { _id: user._id, email: user.email };
  }
  async changePassword(data: ChangePasswordAuthDto) {
    if (data.confirmPassword !== data.password) {
      throw new BadRequestException(
        'Mật khẩu/xác nhận mật khẩu không chính xác.',
      );
    }

    //check email
    const user = await this.userModel.findOne({ email: data.email });

    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    //check expire code
    const isBeforeCheck = dayjs().isBefore(user.codeExpired);

    if (isBeforeCheck) {
      //valid => update password
      const newPassword = await hassPasswordHelper(data.password);
      await user.updateOne({ password: newPassword });
      return { isBeforeCheck };
    } else {
      throw new BadRequestException('Mã code không hợp lệ hoặc đã hết hạn');
    }
  }
}
