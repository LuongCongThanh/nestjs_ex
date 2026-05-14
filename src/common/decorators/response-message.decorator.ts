import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key dùng để lưu thông điệp phản hồi tùy chỉnh trên handler hoặc controller.
 *
 * Key này thường sẽ được đọc lại ở interceptor hoặc lớp xử lý response chung
 * để gắn message vào payload trả về cho client.
 */
export const RESPONSE_MESSAGE = 'response_message';

/**
 * Custom decorator dùng để gắn một thông điệp phản hồi vào metadata của route.
 *
 * Ví dụ: có thể dùng trên một endpoint tạo mới dữ liệu để interceptor đọc được
 * và trả về message như `Create category successfully`.
 *
 * @param message Nội dung thông điệp muốn gắn vào metadata của handler/controller.
 * @returns Decorator do NestJS tạo ra thông qua `SetMetadata`.
 */
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE, message);
