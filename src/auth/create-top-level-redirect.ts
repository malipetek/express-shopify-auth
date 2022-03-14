import querystring from 'querystring';

import {Request, Response} from 'express';

import redirectionPage from './redirection-page';

export default function createTopLevelRedirect(apiKey: string, path: string) {
  return function topLevelRedirect(req: Request, res: Response) {
    const {query} = req;
    const {shop, host} = query;
    const params = {shop};

    // We know shop param is always a string
    // @ts-ignore
    const queryString = querystring.stringify(params);

    res.set('Content-Type', 'text/html');
    res.send(
      redirectionPage({
        origin: shop,
        redirectTo: `https://${host}${path}?${queryString}`,
        apiKey,
        host,
      }),
    );
  };
}
