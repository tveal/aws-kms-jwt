import { KMS } from 'aws-sdk';
import base64url from 'base64url';

import debug from './utils';

class Connector {
  constructor(masterKeyAlias, region = process.env.AWS_REGION) {
    this.masterKeyAlias = masterKeyAlias;
    this.kms = new KMS({
      httpOptions: { timeout: 1000 },
      logger: { log: /* istanbul ignore next */ (msg) => debug(msg) },
      region,
    });
  }

  sign(payload, options) {
    if (!options) {
      options = {};
    }

    return new Promise((resolve, reject) => {
      const headers = {
        alg: 'KMS',
        typ: 'JWT',
      };

      payload.iat = Math.floor(Date.now() / 1000);
      if (options.expires && options.expires instanceof Date) {
        payload.exp = Math.ceil(options.expires.getTime() / 1000);
      }

      const tokenParts = {
        header: base64url(JSON.stringify(headers)),
        payload: base64url(JSON.stringify(payload)),
      };

      this.kms.encrypt({
        Plaintext: Buffer.from(base64url(`${tokenParts.header}.${tokenParts.payload}`), 'base64'),
        KeyId: this.masterKeyAlias,
      }, (err, data) => {
        if (err) return reject(err);

        tokenParts.signature = base64url(Buffer.from(data.CiphertextBlob));
        const token = `${tokenParts.header}.${tokenParts.payload}.${tokenParts.signature}`;
        return resolve(token);
      });
    });
  }

  verify(jwt) {
    return new Promise((resolve, reject) => {
      try {
        const jwtData = this._getJwtData(jwt);
        this._checkIssuedTime(jwtData.payload.iat);
        this._checkExpiration(jwtData.payload.exp);

        this.kms.decrypt({
          CiphertextBlob: Buffer.from(jwtData.encrypted.signature, 'base64'),
        }, (err, kmsData) => {
          if (err) throw err;

          const decryptedSig = base64url.decode(kmsData.Plaintext.toString('base64'));

          if (decryptedSig === `${jwtData.encrypted.header}.${jwtData.encrypted.payload}`) {
            return resolve(jwtData.payload);
          } else {
            throw new Error('Signature is NOT valid');
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  _getJwtData(jwt) {
    if (!jwt || !jwt.split) {
      throw new Error('Invalid Token');
    }

    const tokenParts = jwt.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid Token');
    }

    const jwtData = {};
    try {
      jwtData.header = JSON.parse(base64url.decode(tokenParts[0]));
      jwtData.payload = JSON.parse(base64url.decode(tokenParts[1]));
      jwtData.encrypted = {
        header: tokenParts[0],
        payload: tokenParts[1],
        signature: tokenParts[2],
      };
    } catch (err) {
      throw new Error('Invalid Token');
    }

    return jwtData;
  }

  _checkIssuedTime(issuedAt) {
    if (issuedAt) {
      // Allow for server times that are 10 mins ahead of the local time
      const iat = new Date(issuedAt*1000 - 1000*60*10);

      if (iat >= Date.now()) {
        throw new Error('Token was issued after the current time');
      }
    }
  }

  _checkExpiration(expiresAt) {
    if (expiresAt) {
      const exp = new Date(expiresAt*1000);

      if (exp < Date.now()) {
        throw new Error('Token is expired');
      }
    }
  }
}

export default Connector;
