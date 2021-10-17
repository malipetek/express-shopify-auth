import querystring from 'querystring';

import {Request, Response} from 'express';

import redirectionPage from './redirection-page';

export default function createTopLevelRedirect(apiKey: string, path: string) {
  return function topLevelRedirect(req: Request, res: Response) {
    const {host, query} = req;
    const {shop} = query;

    const params = {shop};
    const queryString = querystring.stringify(params);

    res.send(redirectionPage({
      origin: shop,
      redirectTo: `https://${host}${path}?${queryString}`,
      apiKey,
    }));
  };
}
