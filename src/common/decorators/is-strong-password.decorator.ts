import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Custom decorator dùng để kiểm tra độ mạnh của mật khẩu.
 *
 * Một mật khẩu được xem là hợp lệ khi thỏa tất cả các điều kiện cơ bản:
 * có độ dài tối thiểu, chứa chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
 *
 * @param validationOptions Tùy chọn bổ sung của `class-validator` như `message`, `groups`, `each`,...
 * @returns PropertyDecorator dùng để gắn vào các field cần validate mật khẩu mạnh.
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  /**
   * Hàm decorator thực tế được áp dụng lên property của class.
   *
   * @param object Đối tượng chứa property được gắn decorator.
   * @param propertyName Tên property cần kiểm tra.
   */
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        /**
         * Kiểm tra giá trị đầu vào có đáp ứng tiêu chí mật khẩu mạnh hay không.
         *
         * @param value Giá trị thực tế của field cần validate.
         * @returns `true` nếu mật khẩu hợp lệ, ngược lại trả về `false`.
         */
        validate(value: any) {
          if (typeof value !== 'string') return false;

          // Mật khẩu phải có ít nhất 8 ký tự để tránh quá ngắn và dễ đoán.
          if (value.length < 8) return false;

          // Phải có ít nhất 1 chữ cái in hoa.
          if (!/[A-Z]/.test(value)) return false;

          // Phải có ít nhất 1 chữ cái in thường.
          if (!/[a-z]/.test(value)) return false;

          // Phải có ít nhất 1 chữ số.
          if (!/\d/.test(value)) return false;

          // Phải có ít nhất 1 ký tự đặc biệt để tăng độ phức tạp của mật khẩu.
          if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return false;

          return true;
        },
        /**
         * Trả về thông báo lỗi mặc định khi mật khẩu không đạt yêu cầu.
         *
         * @returns Chuỗi mô tả các điều kiện của một mật khẩu mạnh.
         */
        defaultMessage() {
          return 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
        },
      },
    });
  };
}
