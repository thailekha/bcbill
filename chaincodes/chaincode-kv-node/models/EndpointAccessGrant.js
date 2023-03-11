const LedgerEntity = require('./LedgerEntity');
const hash = require('object-hash');
const _l = require('../lib/logger');
const CustomException = require('../lib/CustomException');
const {fromProvider, parseEmail} = require('../lib/contract-utils');
const {Endpoint} = require('./Endpoint');
const {OriginServer} = require('./OriginServer');
const status = require('http-status-codes').StatusCodes;

function makeEndpointAccessGrantId(endpointId, clientEmail) {
  return hash({endpointId, clientEmail});
}

const DOCTYPE = 'EndpointAccessGrant';

/**
 * When using timestamp: remember each peer has to execute this,
 * since each peer would get a different timestamp, the endorsement policy will break
 */
class EndpointAccessGrant extends LedgerEntity {
  constructor(ctx,
    endpointId, clientEmail,
    requestedBy = clientEmail, approvedBy = null, clientIds = [], limit = 20, revoked= false
  ) {
    if (!clientEmail) {
      throw new Error(`invalid clientEmail ${clientEmail}`);
    }
    super(ctx,
      makeEndpointAccessGrantId(endpointId, clientEmail),
      { endpointId, clientEmail, requestedBy, approvedBy, clientIds, limit, revoked },
      DOCTYPE
    );
  }

  static construct(ctx, ledgerBlob) {
    const { endpointId, clientEmail, requestedBy, approvedBy, clientIds, limit, revoked } = ledgerBlob;
    return new EndpointAccessGrant(ctx, endpointId, clientEmail, requestedBy, approvedBy, clientIds, limit, revoked);
  }

  async approve() {
    _l('Approving');
    const providerEmail = fromProvider(this.ctx, true, true);
    this.value.approvedBy = providerEmail;
    await this.update();
    _l('Approved');
  }

  static async get(ctx, endpointId, clientEmail, opt={ failFast: false}) {
    // check path exists
    // check mapping exists
    // check that state allows
    const eag = await super._get(ctx, makeEndpointAccessGrantId(endpointId, clientEmail), opt, DOCTYPE, EndpointAccessGrant);
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

  fullyGranted() {
    const requestor = parseEmail(this.ctx);
    const extraCondition = requestor === this.value.requestedBy ? true : this.value.clientIds.includes(requestor);
    return this.value.approvedBy
      && this.value.limit > 0
      && !this.value.revoked
      && extraCondition;
  }

  async getOriginServerInfo() {
    if (!this.fullyGranted()) {
      return false;
    }

    const endpoint = await Endpoint.getById(this.ctx, this.value.endpointId);
    const originServer = await OriginServer.getById(this.ctx, endpoint.value.originServerId);

    return {
      host: originServer.value.host,
      path: endpoint.value.path,
      verb: endpoint.value.verb
    };
  }

  /*
    Can only share if
      - it's the client who originally created the eag
      - client is not the same as otherClient
      - approved, has enough limit, and not revoked
      - otherClient exists
   */
  shareWith(otherClientEmail) {
    const requestor = parseEmail(this.ctx);
    if (requestor === otherClientEmail || requestor !== this.value.requestedBy || !this.fullyGranted()) {
      throw new CustomException(status.FORBIDDEN);
    }
    this.value.clientIds.push(otherClientEmail);
    this.value.clientIds = [...new Set(this.value.clientIds)];
  }
}

module.exports = {
  EndpointAccessGrant,
  DOCTYPE
};
