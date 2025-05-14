import bcrypt = require('bcrypt');
const saltRounds = 10;

export const hassPasswordHelper = async (plainPassword: string) => {
  try {
    return await bcrypt.hash(plainPassword, saltRounds);
  } catch (error) {
    console.error('Eror Hasing PassWord:', error);
    // Có thể throw lỗi để tầng gọi biết mà xử lý tiếp
    throw new Error('Hashing password failed');
  }
};

// hàm so sánh password
export const comparePasswordHelper = async (
  plainPassword: string,
  hassPassword: string,
) => {
  try {
    return await bcrypt.compare(plainPassword, hassPassword);
  } catch (error) {
    console.error('Eror Hasing PassWord:', error);
    // Có thể throw lỗi để tầng gọi biết mà xử lý tiếp
    throw new Error('Hashing password failed');
  }
};
