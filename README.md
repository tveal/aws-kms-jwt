# AWS KMS JWT

Goal: provide a library for JWT signing and verifying with a KMS CMK.

Based on 2 npm packages:
- [jwt-kms](https://www.npmjs.com/package/jwt-kms)
    source at [github](https://github.com/jonathankeebler/jwt-kms)
- [aws-kms-ee](https://www.npmjs.com/package/aws-kms-ee)
    source at [github](https://github.com/DanteInc/aws-kms-ee)

## Usage

This is a library to use with JavaScript source, not a CLI tool.

**Prerequisites**
- Authenticated CLI session to your AWS account
- Set the `AWS_REGION` env variable
- Set the `CMK_ALIAS` env variable (or hard-code in the function call);
    This is the AWS KMS CMK alias for the key you wish to sign the token with

```javascript
const { signJwt, verifyJwt } = require('aws-kms-jwt');

const main = async () => {
    const signedToken = await signJwt({ foo: 'bar' }, process.env.CMK_ALIAS);
    console.log(signedToken);

    const verifiedToken = await verifyJwt(signedToken);
    console.log(verifiedToken);
};

main();
```

## This Project Source

For working code using this library, see
[test/int/index.test.js](test/int/index.test.js). To run the integration tests in
this project, set the value of `CMK_ALIAS` accordingly and run (requires active
aws cli session):

```bash
CMK_ALIAS=alias/my-aws-cmk npm run test:int
```
