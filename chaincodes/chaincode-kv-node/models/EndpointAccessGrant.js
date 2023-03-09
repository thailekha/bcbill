const LedgerEntity = require('./LedgerEntity');
const hash = require('object-hash');
const _l = require('../lib/logger');
const CustomException = require('../lib/CustomException');
const {fromProvider} = require('../lib/contract-utils');
const status = require('http-status-codes').StatusCodes;

function makeEndpointAccessGrantId(providerEmail, host, path, verb, clientEmail) {
  return hash({providerEmail, host, path, verb, clientEmail});
}

const DOCTYPE = 'EndpointAccessGrant';

/**
 * When using timestamp: remember each peer has to execute this,
 * since each peer would get a different timestamp, the endorsement policy will break
 */
class EndpointAccessGrant extends LedgerEntity {
  constructor(ctx,
    providerEmail, host, path, verb, clientEmail,
    requestedBy = clientEmail, approvedBy = null, clientIds = [clientEmail], limit = 20, revoked= false
  ) {
    if (!clientEmail) {
      throw new Error(`invalid clientEmail ${clientEmail}`);
    }
    super(ctx,
      makeEndpointAccessGrantId(providerEmail, host, path, verb, clientEmail),
      { providerEmail, host, path, verb, clientEmail, requestedBy, approvedBy, clientIds, limit, revoked },
      DOCTYPE
    );
  }

  static construct(ctx, ledgerBlob) {
    _l('EndPointAccessGrant ledger blob', ledgerBlob);
    const { providerEmail, host, path, verb, clientEmail, requestedBy, approvedBy, clientIds, limit, revoked } = ledgerBlob;
    return new EndpointAccessGrant(ctx, providerEmail, host, path, verb, clientEmail, requestedBy, approvedBy, clientIds, limit, revoked);
  }

  async approve() {
    _l('Approving');
    const providerEmail = fromProvider(this.ctx, true, true);
    this.value.approvedBy = providerEmail;
    await this.update();
    _l('Approved');
  }

  static async get(ctx, providerEmail, host, path, verb, clientEmail, opt={ failFast: false}) {
    // check path exists
    // check mapping exists
    // check that state allows
    const eag = await super._get(ctx, makeEndpointAccessGrantId(providerEmail, host, path, verb, clientEmail), opt, DOCTYPE, EndpointAccessGrant);
    if (eag === null) {
      throw new CustomException(status.FORBIDDEN);
    }
    return eag;
  }

  static async getById(ctx, id, opt={ failFast: false}) {
    return await super._get(ctx, id, opt, DOCTYPE, EndpointAccessGrant);
  }

  static async getByIdForProvider(ctx, id, opt={ failFast: false}) {
    fromProvider(ctx);
    return await super._get(ctx, id, opt, DOCTYPE, EndpointAccessGrant);
  }

  async processProxyRequest(clientId) {
    const isValid = this.value.approvedBy
      && this.value.clientIds.includes(clientId)
      && this.value.limit > 0
      && !this.value.revoked;
    _l("processProxyRequest", clientId, isValid, this.value.approvedBy, this.value.clientIds, this.value.limit, this.value.revoked);
    return isValid ? {
      host: this.value.host,
      path: this.value.path,
      verb: this.value.verb
    } : false;
  }
}

module.exports = {
  EndpointAccessGrant,
  DOCTYPE
};
