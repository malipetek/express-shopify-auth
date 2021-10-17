import Shopify from '@shopify/shopify-api';
import { Session } from '@shopify/shopify-api/dist/auth/session';

import {Request, Response} from 'express';

import {AccessMode, NextFunction} from '../types';
import {TEST_COOKIE_NAME, TOP_LEVEL_OAUTH_COOKIE_NAME} from '../index';

import {Routes} from './types';
import {redirectToAuth} from './utilities';
import {DEFAULT_ACCESS_MODE} from '../auth';
import { HttpResponseError } from '@shopify/shopify-api/dist/error';

export const REAUTH_HEADER = 'X-Shopify-API-Request-Failure-Reauthorize';
export const REAUTH_URL_HEADER = 'X-Shopify-API-Request-Failure-Reauthorize-Url';

export function verifyToken(routes: Routes, accessMode: AccessMode = DEFAULT_ACCESS_MODE, returnHeader = false) {
  return async function verifyTokenMiddleware(
    req: Request, 
    res: Response,
    next: NextFunction,
  ) {
    let session: Session | undefined;
    session = await Shopify.Utils.loadCurrentSession(req, res, accessMode === 'online');

    if (session) {
      const scopesChanged = !Shopify.Context.SCOPES.equals(session.scope);

      if (!scopesChanged && session.accessToken && (!session.expires || session.expires >= new Date())) {
        try {
          // make a request to make sure oauth has succeeded, retry otherwise
          const client = new Shopify.Clients.Rest(session.shop, session.accessToken)
          await client.get({ path: "metafields", query: {'limit': 1} }) 

          res.cookies.set(TOP_LEVEL_OAUTH_COOKIE_NAME);
          return next();
        } catch(e) {
          if (e instanceof HttpResponseError && e.code == 401){
              // only catch 401 errors
          } else {
            throw e
          }
        }
      }
    }

    res.cookies.set(TEST_COOKIE_NAME, '1');

    if (returnHeader) {
      res.status(403);
      res.set(REAUTH_HEADER, '1');

      let shop: string|undefined = undefined;
      if (session) {
        shop = session.shop;
      } else if (Shopify.Context.IS_EMBEDDED_APP) {
        const authHeader: string|undefined = req.headers.authorization;
        const matches = authHeader?.match(/Bearer (.*)/);
        if (matches) {
          const payload = Shopify.Utils.decodeSessionToken(matches[1]);
          shop = payload.dest.replace('https://', '');
        }
      }

      if (shop) {
        res.set(REAUTH_URL_HEADER, `${routes.authRoute}?shop=${shop}`);
      }
      return next();
    } else {
      redirectToAuth(routes, req, res);
    }
  };
}
