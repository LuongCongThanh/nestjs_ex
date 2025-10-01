import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

// Hàm trích xuất Bearer token từ header Authorization
// Ví dụ header: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
const bearerExtractor = (request: Request): string | null => {
  // Lấy header authorization (thử cả 2 cách để đảm bảo tương thích)
  const header = request.headers?.authorization ?? request.get('authorization');
  if (!header) return null; // Không có header thì trả về null

  // Tách header thành 2 phần: [scheme, token]
  // VD: "Bearer xyz123" → ["Bearer", "xyz123"]
  const [scheme, token] = header.split(' ');

  // Kiểm tra scheme phải là "bearer" (không phân biệt hoa thường)
  // và phải có token
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

  return token; // Trả về token đã trích xuất
};

// Strategy xác thực JWT cho Access Token
// Kế thừa từ PassportStrategy với Strategy của passport-jwt
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    // Cấu hình strategy cho Passport
    super({
      // Hàm trích xuất JWT từ request
      jwtFromRequest: bearerExtractor,

      // Không cho phép token hết hạn (false = từ chối token đã expired)
      ignoreExpiration: false,

      // Secret key để verify chữ ký JWT
      // Phải trùng với key dùng để ký token trong AuthService
      secretOrKey:
        config.get<string>('JWT_ACCESS_SECRET') ?? 'dev_access_secret',
    });
  }

  // Hàm validate được gọi TỰ ĐỘNG sau khi Passport verify token thành công
  // Payload đã được giải mã và verify chữ ký bởi Passport
  // Giá trị return sẽ được gán vào req.user để dùng trong controllers/guards
  validate(payload: JwtPayload): JwtPayload {
    return payload; // Gán payload vào req.user
  }
}
