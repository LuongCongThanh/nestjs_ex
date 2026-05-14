import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Custom decorator dùng để kiểm tra chuỗi có đúng định dạng slug hay không.
 *
 * Slug thường được dùng trong URL thân thiện, ví dụ: `dien-thoai-samsung-s24`.
 * Decorator này chỉ cho phép chữ thường, chữ số và dấu gạch ngang.
 *
 * @param validationOptions Tùy chọn bổ sung của `class-validator` như `message`, `groups`, `each`,...
 * @returns PropertyDecorator dùng để gắn vào các field cần validate định dạng slug.
 */
export function IsSlug(validationOptions?: ValidationOptions) {
  /**
   * Hàm decorator thực tế được áp dụng lên property của class.
   *
   * @param object Đối tượng chứa property được gắn decorator.
   * @param propertyName Tên property cần kiểm tra.
   */
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSlug',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        /**
         * Kiểm tra giá trị đầu vào có đúng định dạng slug hay không.
         *
         * @param value Giá trị thực tế của field cần validate.
         * @returns `true` nếu chuỗi hợp lệ, ngược lại trả về `false`.
         */
        validate(value: any) {
          if (typeof value !== 'string') return false;

          // Quy tắc slug:
          // Chỉ cho phép chữ thường a-z, số 0-9 và dấu gạch ngang `-`.
          // Không được bắt đầu hoặc kết thúc bằng dấu `-`.
          // Không cho phép 2 dấu `-` liên tiếp.
          const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

          return slugRegex.test(value);
        },
        /**
         * Trả về thông báo lỗi mặc định khi giá trị không đúng định dạng slug.
         *
         * @returns Chuỗi mô tả điều kiện hợp lệ của slug.
         */
        defaultMessage() {
          return 'Slug must contain only lowercase letters, numbers, and hyphens (cannot start/end with hyphen or have consecutive hyphens)';
        },
      },
    });
  };
}
