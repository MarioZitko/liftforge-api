// src/modules/auth/interfaces/auth-request.interface.ts
import { Request } from 'express';

export interface OAuthUser {
  email: string;
  name?: string;
  userId?: string; // for JWT strategy
  role?: string; // for JWT strategy
}

export interface AuthenticatedRequest extends Request {
  user?: OAuthUser;
  cookies: {
    pending_oauth_email?: string;
    pending_oauth_name?: string;
    [key: string]: any;
  };
}
