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

  it('should verify jwt', async () => {
    const response = verifyJwt();

    expect(response).to.equal('TODO: implement JWT verify');
  });
});
