import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '@/decorator/customize';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  //@Public()
  create(@Body() createUserDto: CreateUserDto) {
    console.log('đã tạo thành công', createUserDto);
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Public()
  async findAll(
    @Query()
    query: string,
    @Query('current') current: string,
    @Query('pageSize') pageSize: string,
  ) {
    // có thể convert qua number +current
    return this.usersService.findAll(query, +current, +pageSize);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch()
  @Public()
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(updateUserDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
