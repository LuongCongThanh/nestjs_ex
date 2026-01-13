/**
 * Update User DTO - Data Transfer Object cho việc cập nhật user
 *
 * DTO này kế thừa từ CreateUserDto nhưng:
 * - Loại bỏ email và password (dùng OmitType)
 * - Tất cả fields đều optional (dùng PartialType)
 *
 * Kết quả:
 * - Có thể update: firstName, lastName, phone, role
 * - Không thể update: email, password
 * - Tất cả fields đều optional (partial update)
 *
 * Example: PATCH /users/:id { "firstName": "Jane" } → Chỉ update firstName
 */

import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['email', 'password'] as const)) {}
