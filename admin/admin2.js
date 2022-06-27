'use strict';

const fs = require('fs');
const jsonfile = require('jsonfile');
const { Wallets } = require('fabric-network');
const { connectionProfileOrg2, caClient } = require('../utils');
const userWalletCreated = user => fs.existsSync(`./wallet2/${user}.id`);

const ADMIN_ID = 'admin';
const ADMIN_PWD = 'adminpw';

const MSP = 'Org2MSP';
const WALLET_PATH = require('path').join(__dirname, 'wallet2');
const CA_HOST = 'ca.org2.example.com';
const AFFILIATION = 'org2.department1';

let wallet;
let peer;
let ca;

async function main() {
  try {
    await init();
    await admin();
    await emails();
    // await initLedger();
  } catch (e) {
    console.error(e);
  }
}

async function init() {
  // Note: wallet can be built in memory as well
  wallet = await Wallets.newFileSystemWallet(WALLET_PATH);
  peer = connectionProfileOrg2();
  ca = caClient(peer, CA_HOST);
}

async function admin() {
  if (userWalletCreated(ADMIN_ID) || (await wallet.get(ADMIN_ID))) { return; }
  const enrollment = await ca.enroll({
    enrollmentID: ADMIN_ID,
    enrollmentSecret: ADMIN_PWD
  });
  await wallet.put(ADMIN_ID, {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: MSP,
    type: 'X.509',
  });
}

async function registerEmail(email) {
  const adminIdentity = await wallet.get(ADMIN_ID);
  if ((await wallet.get(email)) || !adminIdentity) return;
  const adminUser = await wallet
    .getProviderRegistry()
    .getProvider(adminIdentity.type)
    .getUserContext(adminIdentity, ADMIN_ID);
  return await ca.register({
    affiliation: AFFILIATION,
    enrollmentID: email,
    role: 'client'
  }, adminUser);
}

async function emails() {
  process.argv.shift();
  process.argv.shift();
  const secrets = {};
  for (const email of process.argv) {
    secrets[email] = await registerEmail(email);
  }
  await jsonfile.writeFile('secret2.json', secrets);
}

main();
