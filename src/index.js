import Connector from './connector';

export const signJwt = (jwt, masterKeyAlias, options) => new Connector(masterKeyAlias).sign(jwt, options);

export const verifyJwt = () => 'TODO: implement JWT verify';
