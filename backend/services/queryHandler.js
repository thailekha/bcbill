// const { QueryHandler } = require('fabric-network');
// const util = require('util');
// const _ = require('lodash');
// const _l = require("./logger");
//
// class RandomPeersQueryHandler {
//   constructor(peers) {
//     this.shuffledPeers = _.shuffle(peers);
//     this.currentIndex = 0;
//   }
//
//   async evaluate(query) {
//     const errorMessages = [];
//     throw new Error("fuck");
//     for (let i = 0; i < this.shuffledPeers.length; i++) {
//       const peer = this.shuffledPeers[this.currentIndex];
//       this.currentIndex = (this.currentIndex + 1) % this.shuffledPeers.length;
//
//       try {
//         const results = await query.evaluate([peer]);
//         const result = results[peer.name];
//
//         if (result instanceof Error) {
//           errorMessages.push(result.toString());
//         } else {
//           if (result.isEndorsed) {
//             return result.payload;
//           } else {
//             const responseError = Object.assign(new Error(result.message), result);
//             throw responseError;
//           }
//         }
//       } catch (error) {
//         errorMessages.push(error.toString());
//       }
//     }
//
//     const message = `Query failed. Errors: ${errorMessages.join(', ')}`;
//     throw new Error(message);
//   }
// }
//
// function filterQueryablePeers(peers) {
//   return peers.filter((peer) => peer.isInRole('chaincodeQuery'));
// }
//
// function getOrganizationPeers(network) {
//   const mspId = network.getGateway().getIdentity().mspId;
//   return network.getChannel().getEndorsers(mspId);
// }
// function getNetworkPeers(network) {
//   return network.getChannel().getEndorsers();
// }
//
// const createQueryHandler = (theNetwork) => {
//   let peers = getOrganizationPeers(theNetwork);
//   if (peers.length === 0) {
//     peers = getNetworkPeers(theNetwork);
//   }
//   return new RandomPeersQueryHandler(peers);
// };
//
// module.exports = createQueryHandler;
