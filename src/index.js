import Connector from './connector';

export const signJwt = (jwt, masterKeyAlias, options) => new Connector(masterKeyAlias).sign(jwt, options);

export const verifyJwt = (jwt, options) => new Connector().verify(jwt, options);
