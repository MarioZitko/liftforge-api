declare namespace Express {
  interface Request {
    cookies: {
      [key: string]: string;
    };
  }
}
