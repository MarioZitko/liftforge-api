import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('FACEBOOK_CLIENT_ID', { infer: true })!,
      clientSecret: config.get<string>('FACEBOOK_CLIENT_SECRET', { infer: true })!,
      callbackURL: `${config.get('BACKEND_URL')}/auth/facebook/redirect`,
      profileFields: ['emails', 'displayName'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<{ email: string; name?: string }> {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName;
    if (!email) throw new Error('No email received from Facebook');
    return { email, name };
  }
}
