import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import base64url from 'base64url';

import Connector from '../../src/connector';

const AWS = require('aws-sdk-mock');

const now = new Date();

describe('connector.js', () => {
  const masterKeyAlias = 'alias/aws-kms-jwt';
  const mockedSignature = 'GobbleDeGoupBlaBlahBlob';
  const base64Header = base64url(JSON.stringify({
    alg: 'KMS',
    typ: 'JWT',
  }));
  let clock = sinon.useFakeTimers(now);
  beforeEach(() => {
    clock = sinon.useFakeTimers(now);
  });
  afterEach(() => {
    AWS.restore('KMS');
    clock.restore();
  });

  it('should sign jwt', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
      CiphertextBlob: mockedSignature,
      KeyId: 'arn:aws:kms:us-east-1:123456789012:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    }));
    AWS.mock('KMS', 'encrypt', spy);

    const payload = { foo: 'jwt-payload' };

    const response = await new Connector(masterKeyAlias).sign(payload);

    // expected payload
    const base64Payload = base64url(JSON.stringify({
      ...payload,
      iat: Math.floor(now / 1000),
    }));
    expect(spy).to.have.been.calledWith({
      KeyId: masterKeyAlias,
      Plaintext: Buffer.from(`${base64Header}.${base64Payload}`),
    });
    expect(response).to.deep.equal(`${base64Header}.${base64Payload}.${mockedSignature}`);
  });

  it('should sign jwt with expiration', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
      CiphertextBlob: mockedSignature,
      KeyId: 'arn:aws:kms:us-east-1:123456789012:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    }));
    AWS.mock('KMS', 'encrypt', spy);

    const payload = { foo: 'jwt-payload' };
    const expires = new Date(now.getTime() + 60000*30);

    const response = await new Connector(masterKeyAlias, 'us-west-2').sign(payload, { expires });

    // expected payload
    const base64Payload = base64url(JSON.stringify({
      ...payload,
      iat: Math.floor(now / 1000),
      exp: Math.ceil(expires.getTime() / 1000),
    }));
    expect(spy).to.have.been.calledWith({
      KeyId: masterKeyAlias,
      Plaintext: Buffer.from(`${base64Header}.${base64Payload}`),
    });
    expect(response).to.deep.equal(`${base64Header}.${base64Payload}.${mockedSignature}`);
  });

  it('should return error for failed KMS encryption', async () => {
    const spy = sinon.spy((params, cb) => cb({ msg: 'some failure message' }, {
      CiphertextBlob: mockedSignature,
      KeyId: 'arn:aws:kms:us-east-1:123456789012:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    }));
    AWS.mock('KMS', 'encrypt', spy);

    const payload = { foo: 'jwt-payload' };
    const expires = new Date(now.getTime() + 60000*30);

    let expectedErr = null;
    try {
      await new Connector(masterKeyAlias, 'us-west-2').sign(payload, { expires });
    } catch (err) {
      expectedErr = err;
    }

    expect(expectedErr).to.deep.equal({ msg: 'some failure message' });
  });
});
