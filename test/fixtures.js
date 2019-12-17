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

const encode = (obj) => base64url(JSON.stringify(obj));
export const createTestJwt = (headers, payload) => [
  encode(headers),
  encode(payload),
  `${base64url(`${encode(headers)}.${encode(payload)}`)}`,
].join('.');

export const SIGNED_JWT = createTestJwt(
  newTokenParts.headers,
  {
    ...newTokenParts.jwt,
    iat: newTokenParts.iat,
  },
);

export const SIGNED_JWT_WITH_EXP = createTestJwt(
  newTokenParts.headers,
  {
    ...newTokenParts.jwt,
    iat: newTokenParts.iat,
    exp: newTokenParts.exp,
  },
);
