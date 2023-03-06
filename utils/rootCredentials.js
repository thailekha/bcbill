const { fsWallet, caClient } = require(`${__dirname}/index`);
require('dotenv').config({ path: `${__dirname}/../.env` });
async function setup() {
  try {
    const wallet = await fsWallet();
    const rootId = process.env.FABRIC_ROOT_ID;
    if (await wallet.get(rootId)) {
      return;
    }
    const enrollment = await caClient().enroll({
      enrollmentID: rootId,
      enrollmentSecret: process.env.FABRIC_ROOT_PW
    });
    await wallet.put(rootId, {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: process.env.FABRIC_MSP,
      type: 'X.509',
    });
  } catch (err) {
    console.error(err);
  }
}

setup();

