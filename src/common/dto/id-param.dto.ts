import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * DTO dùng để validate tham số `id` trên URL.
 *
 * Thường được dùng cho các endpoint dạng `/users/:id`, `/products/:id`,...
 * để đảm bảo giá trị `id` truyền vào là UUID v4 hợp lệ trước khi xử lý nghiệp vụ.
 */
export class IdParamDto {
  /**
   * ID định danh của tài nguyên cần truy cập hoặc thao tác.
   *
   * Field này được validate là UUID phiên bản 4 nhằm đảm bảo dữ liệu đầu vào
   * đúng định dạng mà hệ thống đang sử dụng cho khóa định danh.
   */
  @ApiProperty({
    // Mô tả field này trên Swagger/OpenAPI để frontend hoặc người dùng API dễ hiểu.
    description: 'UUID identifier',
    // Ví dụ một giá trị UUID v4 hợp lệ để hiển thị trong tài liệu API.
    example: '123e4567-e89b-12d3-a456-426614174000',
    // Khai báo format chuẩn để Swagger nhận diện đây là trường UUID.
    format: 'uuid',
  })
  // Chỉ chấp nhận UUID phiên bản 4; nếu sai định dạng sẽ trả về message bên dưới.
  @IsUUID('4', { message: 'ID must be a valid UUID v4' })
  id: string;
}
