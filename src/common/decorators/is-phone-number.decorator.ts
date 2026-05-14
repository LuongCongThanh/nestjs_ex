import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Custom decorator dùng để kiểm tra tính hợp lệ của số điện thoại.
 *
 * Hiện tại decorator hỗ trợ kiểm tra chi tiết cho số điện thoại Việt Nam
 * và cung cấp cơ chế kiểm tra cơ bản cho các quốc gia khác dựa trên độ dài.
 *
 * @param countryCode Mã quốc gia dùng để xác định quy tắc kiểm tra. Mặc định là `VN`.
 * @param validationOptions Tùy chọn bổ sung của `class-validator` như `message`, `groups`, `each`,...
 * @returns PropertyDecorator dùng để gắn vào các field cần validate số điện thoại.
 */
export function IsPhoneNumber(countryCode: string = 'VN', validationOptions?: ValidationOptions) {
  /**
   * Hàm decorator thực tế được `class-validator` gọi khi áp dụng lên property.
   *
   * @param object Đối tượng chứa property được gắn decorator.
   * @param propertyName Tên property cần kiểm tra.
   */
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [countryCode],
      options: validationOptions,
      validator: {
        /**
         * Kiểm tra giá trị đầu vào có phải số điện thoại hợp lệ hay không.
         *
         * @param value Giá trị thực tế của field cần validate.
         * @param args Metadata do `class-validator` truyền vào, bao gồm `constraints`.
         * @returns `true` nếu hợp lệ, ngược lại trả về `false`.
         */
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          const country = (args.constraints?.[0] as string) || countryCode;

          // Loại bỏ mọi ký tự không phải chữ số để chuẩn hóa đầu vào.
          const cleaned = value.replaceAll(/\D/g, '');

          // Áp dụng bộ quy tắc riêng cho số điện thoại Việt Nam.
          if (country === 'VN') {
            // Số điện thoại Việt Nam phải có đúng 10 chữ số và bắt đầu bằng 0.
            if (!/^0\d{9}$/.test(cleaned)) return false;

            // Danh sách đầu số di động hợp lệ tại Việt Nam.
            const validPrefixes = [
              '03',
              '05',
              '07',
              '08',
              '09', // Old format
              '032',
              '033',
              '034',
              '035',
              '036',
              '037',
              '038',
              '039', // Viettel
              '052',
              '056',
              '058',
              '059', // Vietnamobile
              '070',
              '076',
              '077',
              '078',
              '079', // Mobifone
              '081',
              '082',
              '083',
              '084',
              '085',
              '088', // Vinaphone
              '086',
              '096',
              '097',
              '098',
              '089', // Mobifone
            ];

            // Chỉ chấp nhận số bắt đầu bằng một trong các đầu số hợp lệ.
            return validPrefixes.some((prefix) => cleaned.startsWith(prefix));
          }

          // Với quốc gia khác, áp dụng kiểm tra cơ bản theo độ dài chuẩn quốc tế.
          // Số hợp lệ phải có từ 8 đến 15 chữ số sau khi đã được chuẩn hóa.
          return cleaned.length >= 8 && cleaned.length <= 15;
        },
        /**
         * Sinh thông báo lỗi mặc định khi validate thất bại.
         *
         * @param args Metadata do `class-validator` cung cấp.
         * @returns Thông báo lỗi phù hợp theo từng quốc gia.
         */
        defaultMessage(args: ValidationArguments) {
          const country = (args.constraints?.[0] as string) || countryCode;
          if (country === 'VN') {
            return 'Phone number must be a valid Vietnamese phone number (e.g., 0912345678)';
          }
          return 'Phone number must be a valid phone number';
        },
      },
    });
  };
}
