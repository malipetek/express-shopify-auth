import {Request, Response} from 'express';

import Shopify from '@shopify/shopify-api';
import { Session } from '@shopify/shopify-api/dist/auth/session';

import {AccessMode, NextFunction} from '../types';

import {Routes} from './types';
import {clearSession, redirectToAuth} from './utilities';
import {DEFAULT_ACCESS_MODE} from '../auth';

export function loginAgainIfDifferentShop(routes: Routes, accessMode: AccessMode = DEFAULT_ACCESS_MODE) {
  return async function loginAgainIfDifferentShopMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const {query} = req;
    let session: Session | undefined;
    session = await Shopify.Utils.loadCurrentSession(req, res, accessMode === 'online');

    if (session && query.shop && session.shop !== query.shop) {
      await clearSession(req, res, accessMode);
      redirectToAuth(routes, req, res);
      return next();
    }

    await next();
  };
}
