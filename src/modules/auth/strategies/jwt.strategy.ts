// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.token || null, // ✅ Read token from cookie
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', { infer: true })!,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    console.log('✅ JWT payload received:', payload);
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
