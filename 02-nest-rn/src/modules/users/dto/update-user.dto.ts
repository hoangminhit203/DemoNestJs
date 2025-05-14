import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsMongoId({ message: 'id Không hợp lệ' })
  @IsNotEmpty({ message: 'id không được để trống' })
  _id: string;
  // có thể trường lên hay không bỏ qua phần validation
  @IsOptional()
  name: string;
  @IsOptional()
  phone: string;
  @IsOptional()
  address: string;
  @IsOptional()
  image: string;

  /* Đây cách validate chuẩn khi update để tránh trường hợp bậy bạ
    
    // ID bắt buộc, phải là MongoDB ObjectId hợp lệ
  @IsMongoId({ message: 'ID không hợp lệ' })
  @IsNotEmpty({ message: 'ID không được để trống' })
  _id: string;

  // Name chỉ chứa chữ cái, khoảng trắng, và dấu gạch ngang
  @Matches(/^[a-zA-Z\s-]+$/, {
    message: 'Tên chỉ được chứa chữ cái, khoảng trắng, và dấu gạch ngang',
  })
  name: string;

  // Phone phải là số điện thoại hợp lệ
  @IsPhoneNumber(null, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  // Address không bắt buộc, nhưng không được chứa ký tự nguy hiểm
  @Matches(/^[^<>]*$/, { message: 'Địa chỉ không được chứa ký tự < hoặc >' })
  address: string;

  // Image phải là URL hợp lệ
  @IsUrl({}, { message: 'Image phải là URL hợp lệ' })
  image: string;
    */
}
