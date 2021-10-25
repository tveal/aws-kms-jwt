import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import { signJwt, verifyJwt } from '../../src';
import Connector from '../../src/connector';

import { SIGNED_JWT, SIGNED_JWT_WITH_EXP } from '../fixtures';

describe('index.js', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should sign jwt', async () => {
    const jwt = { foo: 'bar' };

    sinon.stub(Connector.prototype, 'sign')
      .withArgs(jwt)
      .returns(Promise.resolve(SIGNED_JWT));

    const response = await signJwt(jwt, 'masterKeyAlias');

    expect(response).to.deep.equal(SIGNED_JWT);
  });

  it('should sign jwt with options', async () => {
    const jwt = { foo: 'bar' };
    const options = { expires: new Date() };

    sinon.stub(Connector.prototype, 'sign')
      .withArgs(jwt, options)
      .returns(Promise.resolve(SIGNED_JWT_WITH_EXP));

    const response = await signJwt(jwt, 'masterKeyAlias', options);

    expect(response).to.deep.equal(SIGNED_JWT_WITH_EXP);
  });

  it('should sign jwt with options using digest', async () => {
    const jwt = { foo: 'bar' };
    const options = { expires: new Date(), useDigest: true };

    sinon.stub(Connector.prototype, 'sign')
      .withArgs(jwt, options)
      .returns(Promise.resolve(SIGNED_JWT_WITH_EXP));

    const response = await signJwt(jwt, 'masterKeyAlias', options);

    expect(response).to.deep.equal(SIGNED_JWT_WITH_EXP);
  });

  it('should verify jwt', async () => {
    const jwt = { foo: 'bar' };
    sinon.stub(Connector.prototype, 'verify')
      .withArgs(jwt)
      .returns(Promise.resolve(jwt));

    const response = await verifyJwt(jwt);

    expect(response).to.deep.equal(jwt);
  });
  it('should verify jwt with option useDigest', async () => {
    const jwt = { foo: 'bar' };
    sinon.stub(Connector.prototype, 'verify')
      .withArgs(jwt)
      .returns(Promise.resolve(jwt));

    const response = await verifyJwt(jwt, { useDigest: true });

    expect(response).to.deep.equal(jwt);
  });
});
