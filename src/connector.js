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

        tokenParts.signature = data.CiphertextBlob.toString('base64');
        const token = `${tokenParts.header}.${tokenParts.payload}.${tokenParts.signature}`;
        return resolve(token);
      });
    });
  }
}

export default Connector;
