import {Request} from 'express';

export default function getCookieOptions(req: Request) {
  const {header} = req;
  const userAgent = header['user-agent'];
  const isChrome = userAgent && userAgent.match(/chrome|crios/i);
  let cookieOptions = {};
  if (isChrome) {
    cookieOptions = {
      secure: true,
    };
  }
  return cookieOptions;
}
