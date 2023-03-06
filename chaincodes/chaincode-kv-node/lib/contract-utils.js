const status = require('http-status-codes').StatusCodes;
const { ClientIdentity } = require('fabric-shim');
const CustomException = require('./CustomException');
const _l = require('./logger');

const fromProvider = (ctx, throwErr = true) => {
  const cid = new ClientIdentity(ctx.stub);
  const email = parseCommonNameFromx509DistinguishedName(cid.getID());
  const isProvider = email.includes('provider');
  if (!isProvider && throwErr) {
    _l('Not provider: ', cid.getID(), email);
    throw new CustomException(status.FORBIDDEN);
  }
  return isProvider;
};

/**
 * Parses the common name from an X.509 distinguished name.
 * @param {string} dn The X.509 distinguished name.
 * @returns {string} The common name.
 */
const parseCommonNameFromx509DistinguishedName = dn => {
  // 'x509::/OU=org2/OU=client/OU=department1/CN=staff1@org2.com::/C=US/ST=California/L=San Francisco/O=org2.example.com/CN=ca.org2.example.com'
  const parseResult = dn
    .split('::')[1]
    .split('/')
    .filter((i) => i.length > 0 && i.includes('CN='))
    .map((i) => i.split('=')[1]);
  return parseResult[0];
};

async function assetExists(ctx, id) {
  const assetJSON = await ctx.stub.getState(id);
  if (!(assetJSON && assetJSON.length > 0)) {
    throw new Error(`The asset ${id} does not exist`);
  }
}

module.exports = {
  fromProvider: fromProvider,
  parseCommonNameFromx509DistinguishedName
};
