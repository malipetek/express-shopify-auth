import {Request, Response} from 'express';

import Shopify from '@shopify/shopify-api';

import {Routes} from './types';
import {AccessMode} from '../types';
import {DEFAULT_ACCESS_MODE} from '../auth';

export function redirectToAuth(
  {fallbackRoute, authRoute}: Routes,
  req: Request,
  res: Response
) {
  const {
    query: {shop},
  } = req;

  const routeForRedirect =
    shop == null ? fallbackRoute : `${authRoute}?shop=${shop}`;

  res.redirect(routeForRedirect);
}

export async function clearSession(req: Request, res: Response, accessMode: AccessMode = DEFAULT_ACCESS_MODE) {
  try {
    await Shopify.Utils.deleteCurrentSession(req, res, accessMode === 'online');
  }
  catch (error) {
    if (error instanceof Shopify.Errors.SessionNotFound) {
      // We can just move on if no sessions were cleared
    } else {
      throw error;
    }
  }
}
