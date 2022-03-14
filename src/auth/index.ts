import {Request, Response} from 'express';

import {OAuthStartOptions, AccessMode, NextFunction} from '../types';

import getCookieOptions from './cookie-options';
import createEnableCookies from './create-enable-cookies';
import createTopLevelOAuthRedirect from './create-top-level-oauth-redirect';
import createRequestStorageAccess from './create-request-storage-access';
import setUserAgent from './set-user-agent';

import Shopify, {AuthQuery} from '@shopify/shopify-api';

const DEFAULT_MYSHOPIFY_DOMAIN = 'myshopify.com';
export const DEFAULT_ACCESS_MODE: AccessMode = 'online';

export const TOP_LEVEL_OAUTH_COOKIE_NAME = 'shopifyTopLevelOAuth';
export const TEST_COOKIE_NAME = 'shopifyTestCookie';
export const GRANTED_STORAGE_ACCESS_COOKIE_NAME =
  'shopify.granted_storage_access';

function hasCookieAccess({cookies}: Request) {
  return Boolean(cookies.TEST_COOKIE_NAME);
}

function grantedStorageAccess({cookies}: Request) {
  return Boolean(cookies.GRANTED_STORAGE_ACCESS_COOKIE_NAME);
}

function shouldPerformInlineOAuth({cookies}: Request) {
  return Boolean(cookies.TOP_LEVEL_OAUTH_COOKIE_NAME);
}

export default function createShopifyAuth(options: OAuthStartOptions) {
  const config = {
    prefix: '',
    myShopifyDomain: DEFAULT_MYSHOPIFY_DOMAIN,
    accessMode: DEFAULT_ACCESS_MODE,
    ...options,
  };

  const {prefix} = config;

  const oAuthStartPath = `${prefix}/auth`;
  const oAuthCallbackPath = `${oAuthStartPath}/callback`;

  const inlineOAuthPath = `${prefix}/auth/inline`;
  const topLevelOAuthRedirect = createTopLevelOAuthRedirect(
    Shopify.Context.API_KEY,
    inlineOAuthPath,
  );

  const enableCookiesPath = `${oAuthStartPath}/enable_cookies`;
  const enableCookies = createEnableCookies(config);
  const requestStorageAccess = createRequestStorageAccess(config);

  setUserAgent();

  return async function shopifyAuth(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    req.cookies.secure = true;

    if (
      req.path === oAuthStartPath &&
      !hasCookieAccess(req) &&
      !grantedStorageAccess(req)
    ) {
      return await requestStorageAccess(req, res);
    }

    if (
      req.path === inlineOAuthPath ||
      (req.path === oAuthStartPath && shouldPerformInlineOAuth(req))
    ) {
      const shop = req.query.shop as string;
      if (shop == null) {
        res.status(400);
      }

      req.cookies.set(TOP_LEVEL_OAUTH_COOKIE_NAME, '', getCookieOptions(req));
      const redirectUrl = await Shopify.Auth.beginAuth(
        req,
        res,
        shop,
        oAuthCallbackPath,
        config.accessMode === 'online',
      );
      res.redirect(redirectUrl);
      return;
    }

    if (req.path === oAuthStartPath) {
      await topLevelOAuthRedirect(req, res);
      return next();
    }

    if (req.path === oAuthCallbackPath) {
      try {
        const authQuery: AuthQuery = {
          code: req.query.code as string,
          shop: req.query.shop as string,
          host: req.query.host as string,
          state: req.query.state as string,
          timestamp: req.query.timestamp as string,
          hmac: req.query.hmac as string,
        };

        res.locals.shopify = await Shopify.Auth.validateAuthCallback(
          req,
          res,
          authQuery,
        );

        if (config.afterAuth) {
          await config.afterAuth(req, res);
        }
      } catch (e) {
        switch (true) {
          case e instanceof Shopify.Errors.InvalidOAuthError:
            res.status(400).send(e.message);
            break;
          case e instanceof Shopify.Errors.CookieNotFound:
          case e instanceof Shopify.Errors.SessionNotFound:
            // This is likely because the OAuth session cookie expired before the merchant approved the request
            res.redirect(`${oAuthStartPath}?shop=${req.query.shop}`);
            break;
          default:
            res.status(500).send(e.message);
            break;
        }
      }
      return;
    }

    if (req.path === enableCookiesPath) {
      await enableCookies(req, res);
      return;
    }

    await next();
  };
}

export {default as Error} from './errors';
