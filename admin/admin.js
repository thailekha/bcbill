'use strict';

const fs = require('fs');
const jsonfile = require('jsonfile');
const { Wallets } = require('fabric-network');
const { caClient, getPeer, clone, parseOrgFromEmail } = require('../utils');
const userWalletCreated = (user, orgNo) => fs.existsSync(`./wallet${orgNo}/${user}.id`);

const ADMIN_ID = 'admin';
const ADMIN_PWD = 'adminpw';

const MSP = orgNo => `Org${orgNo}MSP`;
const CA_HOST = orgNo => `ca.org${orgNo}.example.com`;
const AFFILIATION = orgNo => `org${orgNo}.department1`;

function parseEmailArgs() {
  const emails = clone(process.argv);
  emails.shift();
  emails.shift();
  return emails;
}

async function main() {
  try {
    const secrets = {};
    for (const email of parseEmailArgs()) {
      const orgNo = parseOrgFromEmail(email);
      const wallet = await Wallets.newFileSystemWallet(`./wallet${orgNo}`);
      const peer = getPeer(email);
      const ca = caClient(peer, CA_HOST(orgNo));

      await setupAdminWallet(wallet, ca, orgNo);
      secrets[email] = await registerEmail(wallet, ca, orgNo, email);
    }
    jsonfile.writeFile('secrets.json', secrets);
  } catch (e) {
    console.error(e);
  }
}

async function setupAdminWallet(wallet, ca, orgNo) {
  if (userWalletCreated(ADMIN_ID, orgNo) || (await wallet.get(ADMIN_ID))) { return; }
  const enrollment = await ca.enroll({
    enrollmentID: ADMIN_ID,
    enrollmentSecret: ADMIN_PWD
  });
  await wallet.put(ADMIN_ID, {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: MSP(orgNo),
    type: 'X.509',
  });
}

async function registerEmail(wallet, ca, orgNo, email) {
  const adminIdentity = await wallet.get(ADMIN_ID);
  if ((await wallet.get(email)) || !adminIdentity) return;
  const adminUser = await wallet
    .getProviderRegistry()
    .getProvider(adminIdentity.type)
    .getUserContext(adminIdentity, ADMIN_ID);
  return await ca.register({
    affiliation: AFFILIATION(orgNo),
    enrollmentID: email,
    role: 'client'
  }, adminUser);
}

main();
