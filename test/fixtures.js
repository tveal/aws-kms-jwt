import base64url from 'base64url';

const newTokenParts = {
  jwt: { foo: 'bar' },
  headers: {
    alg: 'KMS',
    typ: 'JWT',
  },
  iat: 10000000,
  exp: 11800000,
};
const mockedSignature = 'GobbleDeGoupBlaBlahBlob';
const encode = (obj) => base64url(JSON.stringify(obj));

export const SIGNED_JWT = [
  encode(newTokenParts.headers),
  encode({
    ...newTokenParts.jwt,
    iat: newTokenParts.iat,
  }),
  mockedSignature,
].join('.');

export const SIGNED_JWT_WITH_EXP = [
  encode(newTokenParts.headers),
  encode({
    ...newTokenParts.jwt,
    iat: newTokenParts.iat,
    exp: newTokenParts.exp,
  }),
  mockedSignature,
].join('.');
