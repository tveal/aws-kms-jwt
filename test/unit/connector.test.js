import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import base64url from 'base64url';

import Connector from '../../src/connector';
import {
  SIGNED_JWT,
  SIGNED_JWT_WITH_EXP,
  createTestJwt,
} from '../fixtures';

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

  describe('Signing Tokens', () => {
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
      const expectedSignature = base64url(mockedSignature);
      expect(spy).to.have.been.calledWith({
        KeyId: masterKeyAlias,
        Plaintext: Buffer.from(`${base64Header}.${base64Payload}`),
      });
      expect(response).to.deep.equal(`${base64Header}.${base64Payload}.${expectedSignature}`);
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
      const expectedSignature = base64url(mockedSignature);
      expect(spy).to.have.been.calledWith({
        KeyId: masterKeyAlias,
        Plaintext: Buffer.from(`${base64Header}.${base64Payload}`),
      });
      expect(response).to.deep.equal(`${base64Header}.${base64Payload}.${expectedSignature}`);
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

  describe('Verifying Tokens', () => {
    it('should verify jwt', async () => {
      const spy = sinon.spy((params, cb) => cb(null, {
        Plaintext: SIGNED_JWT.split('.')[2],
      }));
      AWS.mock('KMS', 'decrypt', spy);

      const response = await new Connector(masterKeyAlias).verify(SIGNED_JWT);

      expect(spy).to.have.been.calledWith({
        CiphertextBlob: Buffer.from(SIGNED_JWT.split('.')[2], 'base64'),
      });
      expect(response).to.deep.equal({ foo: 'bar', iat: 10000000 });
    });

    it('should fail to verify expired jwt', async () => {
      const spy = sinon.spy((params, cb) => cb(null, {
        Plaintext: SIGNED_JWT_WITH_EXP.split('.')[2],
      }));
      AWS.mock('KMS', 'decrypt', spy);

      let expectedErr = null;
      try {
        await new Connector(masterKeyAlias).verify(SIGNED_JWT_WITH_EXP);
      } catch (err) {
        expectedErr = err;
      }

      expect(expectedErr.message).equal('Token is expired');
    });

    it('should NOT verify jwt for mismatch signature', async () => {
      const spy = sinon.spy((params, cb) => cb(null, {
        Plaintext: 'bad signature',
      }));
      AWS.mock('KMS', 'decrypt', spy);

      let expectedErr = null;
      try {
        await new Connector(masterKeyAlias).verify(SIGNED_JWT);
      } catch (err) {
        expectedErr = err;
      }

      expect(expectedErr.message).to.equal('Signature is NOT valid');
    });

    it('should NOT verify jwt for bad token type (object vs string)', async () => {
      const spy = sinon.spy((params, cb) => cb(null, {
        Plaintext: SIGNED_JWT.split('.')[2],
      }));
      AWS.mock('KMS', 'decrypt', spy);

      let expectedErr = null;
      try {
        await new Connector(masterKeyAlias).verify({});
      } catch (err) {
        expectedErr = err;
      }

      expect(expectedErr.message).to.equal('Invalid Token');
    });

    it('should NOT verify jwt for null token', async () => {
      const spy = sinon.spy((params, cb) => cb(null, {
        Plaintext: SIGNED_JWT.split('.')[2],
      }));
      AWS.mock('KMS', 'decrypt', spy);

      let expectedErr = null;
      try {
        await new Connector(masterKeyAlias).verify(null);
      } catch (err) {
        expectedErr = err;
      }

      expect(expectedErr.message).to.equal('Invalid Token');
    });

    it('should NOT verify jwt with too few parts (2)', async () => {
      const spy = sinon.spy((params, cb) => cb(null, {
        Plaintext: SIGNED_JWT.split('.')[2],
      }));
      AWS.mock('KMS', 'decrypt', spy);

      let expectedErr = null;
      try {
        await new Connector(masterKeyAlias).verify('part1.part2');
      } catch (err) {
        expectedErr = err;
      }

      expect(expectedErr.message).to.equal('Invalid Token');
    });

    it('should NOT verify jwt with too many parts (4)', async () => {
      const spy = sinon.spy((params, cb) => cb(null, {
        Plaintext: SIGNED_JWT.split('.')[2],
      }));
      AWS.mock('KMS', 'decrypt', spy);

      let expectedErr = null;
      try {
        await new Connector(masterKeyAlias).verify('part1.part2.part3.part4');
      } catch (err) {
        expectedErr = err;
      }

      expect(expectedErr.message).to.equal('Invalid Token');
    });

    it('should NOT verify jwt with no data but with 3 parts', async () => {
      const spy = sinon.spy((params, cb) => cb(null, {
        Plaintext: SIGNED_JWT.split('.')[2],
      }));
      AWS.mock('KMS', 'decrypt', spy);

      let expectedErr = null;
      try {
        await new Connector(masterKeyAlias).verify('..');
      } catch (err) {
        expectedErr = err;
      }

      expect(expectedErr.message).to.equal('Invalid Token');
    });

    it('should NOT verify jwt with bad issued time', async () => {
      const jwt = createTestJwt({
        alg: 'KMS',
        typ: 'JWT',
      }, {
        foo: 'bar',
        iat: Math.floor(now.getTime()/1000 + 1000*60*10),
      });
      const spy = sinon.spy((params, cb) => cb(null, {
        Plaintext: jwt.split('.')[2],
      }));
      AWS.mock('KMS', 'decrypt', spy);

      let expectedErr = null;
      try {
        await new Connector(masterKeyAlias).verify(jwt);
      } catch (err) {
        expectedErr = err;
      }

      expect(expectedErr.message).to.equal('Token was issued after the current time');
    });

    it('should verify jwt with expiration time in the future', async () => {
      const iat = Math.floor(now.getTime()/1000 - 1000*60*111);
      const exp = Math.ceil(now.getTime()/1000 + 1000);
      const jwt = createTestJwt({
        alg: 'KMS',
        typ: 'JWT',
      }, {
        foo: 'bar',
        iat,
        exp,
      });

      const spy = sinon.spy((params, cb) => cb(null, {
        Plaintext: jwt.split('.')[2],
      }));
      AWS.mock('KMS', 'decrypt', spy);

      const response = await new Connector(masterKeyAlias).verify(jwt);

      expect(spy).to.have.been.calledWith({
        CiphertextBlob: Buffer.from(jwt.split('.')[2], 'base64'),
      });
      expect(response).to.deep.equal({ foo: 'bar', iat, exp });
    });

    it('should NOT verify jwt when KMS decrypt throws an exception', async () => {
      const spy = sinon.spy((params, cb) => cb({ msg: 'KMS decrypt error' }, {
        Plaintext: SIGNED_JWT.split('.')[2],
      }));
      AWS.mock('KMS', 'decrypt', spy);

      let expectedErr = null;
      try {
        await new Connector(masterKeyAlias).verify(SIGNED_JWT);
      } catch (err) {
        expectedErr = err;
      }

      expect(expectedErr).to.deep.equal({ msg: 'KMS decrypt error' });
    });

    it('should verify jwt without iat', async () => {
      const jwt = createTestJwt({
        alg: 'KMS',
        typ: 'JWT',
      }, {
        foo: 'bar',
      });

      const spy = sinon.spy((params, cb) => cb(null, {
        Plaintext: jwt.split('.')[2],
      }));
      AWS.mock('KMS', 'decrypt', spy);

      const response = await new Connector(masterKeyAlias).verify(jwt);

      expect(response).to.deep.equal({ foo: 'bar' });
    });
  });
});
