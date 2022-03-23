const fs = require('fs');
const path = require('path');
const FabricCAServices = require('fabric-ca-client');

exports.prettyJSONString = (inputString) => JSON.stringify(JSON.parse(inputString), null, 2);

exports.connectionProfileOrg1 = () => {
  const profilePath = path.join(__dirname, '../fablo-target/fabric-config/connection-profiles/connection-profile-org1.json');
  if (!fs.existsSync(profilePath)) throw new Error(`no such file or directory: ${profilePath}`);
  console.log(`Loaded the network configuration located at ${profilePath}`);
  return JSON.parse(fs.readFileSync(profilePath, 'utf8'));
};

exports.caClient = (peer, caHost) => {
  const caInfo = peer.certificateAuthorities[caHost];
  return new FabricCAServices(caInfo.url, { verify: false }, caInfo.caName);
};
