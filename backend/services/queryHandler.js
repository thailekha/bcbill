const { Network, Query, QueryHandler, QueryHandlerFactory } = require('fabric-network');
const { ChannelPeer } = require('fabric-client');
const util = require('util');

class SampleQueryHandler extends QueryHandler {
  constructor(peers) {
    super();
    this.peers = peers;
  }

  async evaluate(query) {
    const errorMessages = [];

    for (const peer of this.peers) {
      const results = await query.evaluate([peer]);
      const result = results[peer.getName()];

      if (!(result instanceof Error)) {
        return result;
      }
      if (result.isProposalResponse) {
        throw result;
      }
      errorMessages.push(result.message);
    }

    const message = util.format('Evaluate failed with the following errors: %j', errorMessages);
    throw new Error(message);
  }
}

function filterQueryablePeers(peers) {
  return peers.filter((peer) => peer.isInRole('chaincodeQuery'));
}

const createQueryHandler = (network) => {
  const channel = network.getChannel();
  const orgPeers = filterQueryablePeers(channel.getPeersForOrg());
  const networkPeers = filterQueryablePeers(channel.getChannelPeers())
    .filter((peer) => !orgPeers.includes(peer));

  const allPeers = orgPeers.concat(networkPeers);
  return new SampleQueryHandler(allPeers);
};

module.exports = createQueryHandler;
