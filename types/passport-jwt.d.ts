declare module 'passport-jwt' {
  import type { Request } from 'express';

  type DoneCallback = (error: unknown, user?: unknown, info?: unknown) => void;

  export type JwtFromRequestFunction = (req: Request) => string | null;

  export interface StrategyOptions {
    jwtFromRequest: JwtFromRequestFunction;
    secretOrKey: string | Buffer;
    issuer?: string | string[];
    audience?: string | string[];
    algorithms?: string[];
    ignoreExpiration?: boolean;
    passReqToCallback?: boolean;
  }

  export interface StrategyOptionsWithRequest extends StrategyOptions {
    passReqToCallback: true;
  }

  export class Strategy {
    constructor(
      options: StrategyOptions,
      verify?: (payload: unknown, done: DoneCallback) => void,
    );
    constructor(
      options: StrategyOptionsWithRequest,
      verify?: (req: Request, payload: unknown, done: DoneCallback) => void,
    );
  }

  export const ExtractJwt: {
    fromAuthHeaderAsBearerToken(): JwtFromRequestFunction;
    fromAuthHeaderWithScheme(authScheme: string): JwtFromRequestFunction;
    fromBodyField(fieldName: string): JwtFromRequestFunction;
    fromUrlQueryParameter(param: string): JwtFromRequestFunction;
    fromExtractors(extractors: JwtFromRequestFunction[]): JwtFromRequestFunction;
  };
}
