const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const cowsay = require('cowsay');
require('dotenv').config({ path: `${__dirname}/../.env` });

// ########################
// Fabric
// ########################

const connectionProfile = () => parseJsonFile(process.env.FABRIC_CONNECTION_PROFILE);
const caClient = () => {
  const caInfo = connectionProfile().certificateAuthorities[process.env.FABRIC_CA_HOST];
  return new FabricCAServices(caInfo.url, { verify: false }, caInfo.caName);
};

// wallet is just a folder that contains multiple creds
const fsWallet = async () => await Wallets.newFileSystemWallet(process.env.WALLET_PATH);
const inMemWallet = async (email, walletContent) => {
  const wallet = await Wallets.newInMemoryWallet();
  wallet.put(email, walletContent);
  return wallet;
};

/*
  For every new client: register -> get a secret -> use it to enroll -> get wallet content
 */
const registerClient = async (email) => {
  const wallet = await fsWallet();
  const root = await wallet.get(process.env.FABRIC_ROOT_ID);
  const rootUser = await wallet
    .getProviderRegistry()
    .getProvider(root.type)
    .getUserContext(root, process.env.FABRIC_ROOT_ID);

  const ca = await caClient();
  const secret = await ca.register({
    affiliation: 'org1.department1',
    enrollmentID: email,
    role: 'client'
  }, rootUser);
  const enrollment = await ca.enroll({
    enrollmentID: email,
    enrollmentSecret: secret
  });
  const walletContent = {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: process.env.FABRIC_MSP,
    type: 'X.509',
  };
  return walletContent;
};

// ########################
// Data structure
// ########################

const parseJsonFile = filePath => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const prettyJSONString = (inputString) => JSON.stringify(JSON.parse(inputString), null, 2);
const clone = obj => JSON.parse(JSON.stringify(obj));

module.exports = {
  connectionProfile,
  caClient,
  fsWallet,
  inMemWallet,
  registerClient,
  prettyJSONString,
};