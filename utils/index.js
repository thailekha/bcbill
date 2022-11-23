const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

exports.prettyJSONString = (inputString) => JSON.stringify(JSON.parse(inputString), null, 2);

exports.caClient = (peer, caHost) => {
  const caInfo = peer.certificateAuthorities[caHost];
  return new FabricCAServices(caInfo.url, { verify: false }, caInfo.caName);
}; 

exports.connectionProfileOrg1 = () => {
  const profilePath = path.join(__dirname, '../fablo-target/fabric-config/connection-profiles/connection-profile-org1.json');
  if (!fs.existsSync(profilePath)) throw new Error(`no such file or directory: ${profilePath}`);
  console.log(`Loaded the network configuration located at ${profilePath}`);
  return JSON.parse(fs.readFileSync(profilePath, 'utf8'));
};

exports.connectionProfileOrg2 = () => {
  const profilePath = path.join(__dirname, '../fablo-target/fabric-config/connection-profiles/connection-profile-org2.json');
  if (!fs.existsSync(profilePath)) throw new Error(`no such file or directory: ${profilePath}`);
  console.log(`Loaded the network configuration located at ${profilePath}`);
  return JSON.parse(fs.readFileSync(profilePath, 'utf8'));
};

const getConnectionProfile = orgNo => require(`../fablo-target/fabric-config/connection-profiles/connection-profile-org${orgNo}.json`);

const parseOrgFromEmail = email => email.includes('@org1.com') ? '1' : '2';

exports.getConnectionProfile = getConnectionProfile;

exports.parseOrgFromEmail = parseOrgFromEmail;

exports.getPeer = email => getConnectionProfile(parseOrgFromEmail(email));

exports.clone = obj => JSON.parse(JSON.stringify(obj));

exports.LOCATIONS = {
  SASKATOON: [52.146973, -106.647034],
  RUSSIA: [55.75, 37.6],
  GERMANY:	[52.51666667, 13.4]
};