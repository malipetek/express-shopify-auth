import {Request, Response} from 'express';

export type AccessMode = 'online' | 'offline';

export interface AuthConfig {
  myShopifyDomain?: string;
  accessMode?: 'online' | 'offline';
  afterAuth?(req: Request, res: Response): void;
}

export interface OAuthStartOptions extends AuthConfig {
  prefix?: string;
}

export interface NextFunction {
  (): any;
}
