import 'mocha';
import { expect } from 'chai';
import base64url from 'base64url';

import { signJwt, verifyJwt } from '../../src/index';

describe('index.js', () => {
  beforeEach(() => {
    if (!process.env.CMK_ALIAS) {
      throw new Error('The environment variable CMK_ALIAS is not set; Must be set to run integration tests');
    }
  });

  it('should sign token', async () => {
    const signedToken = await signJwt({ foo: 'bar' }, process.env.CMK_ALIAS);

    const tokenParts = signedToken.split('.');
    expect(tokenParts.length).equal(3);
    expect(tokenParts[0]).equal(base64url(JSON.stringify({ alg: 'KMS', typ: 'JWT' })));
  });

  it('should verify token', async () => {
    const signedToken = await signJwt({ foo: 'bar' }, process.env.CMK_ALIAS);
    const verifiedToken = await verifyJwt(signedToken);

    expect(verifiedToken.foo).equal('bar');
  });

  it('should verify token signed with message digest', async () => {
    const signedToken = await signJwt({ foo: 'bar' }, process.env.CMK_ALIAS, { useDigest: true });
    const verifiedToken = await verifyJwt(signedToken, { useDigest: true });

    expect(verifiedToken.foo).equal('bar');
  });
});
