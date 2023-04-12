const status = require('http-status-codes').StatusCodes;
const { ClientIdentity } = require('fabric-shim');
const CustomException = require('./CustomException');
const _l = require('./logger');

const fromProvider = (ctx, throwErr = true, returnProviderEntityID = false) => {
  const cid = new ClientIdentity(ctx.stub);
  const entityID = parseCommonNameFromx509DistinguishedName(cid.getID());
  const isProvider = entityID.includes('provider');
  if (!isProvider && throwErr) {
    _l('Not provider: ', cid.getID(), entityID);
    throw new CustomException(status.FORBIDDEN);
  }
  return returnProviderEntityID ? entityID : isProvider;
};

const parseEntityID = ctx => {
  const cid = new ClientIdentity(ctx.stub);
  return parseCommonNameFromx509DistinguishedName(cid.getID());
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

module.exports = {
  fromProvider,
  parseEntityID,
  parseCommonNameFromx509DistinguishedName
};
