const FabricCAServices = require('fabric-ca-client');

exports.prettyJSONString = (inputString) => JSON.stringify(JSON.parse(inputString), null, 2);

exports.caClient = (peer, caHost) => {
  const caInfo = peer.certificateAuthorities[caHost];
  return new FabricCAServices(caInfo.url, { verify: false }, caInfo.caName);
}; 

const getConnectionProfile = orgNo => require(`../fablo-target/fabric-config/connection-profiles/connection-profile-org${orgNo}.json`);

const parseOrgFromEmail = email => email.includes("@org1.com") ? "1" : "2";

exports.getConnectionProfile = getConnectionProfile;

exports.parseOrgFromEmail = parseOrgFromEmail;

exports.getPeer = email => getConnectionProfile(parseOrgFromEmail(email));

exports.clone = obj => JSON.parse(JSON.stringify(obj));
