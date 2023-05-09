const crypto = require('crypto');
const zlib = require('zlib');

const secret = 'be864174656596ae7fd818e32236dfddf96f2e335fc18600f0290906a051ebf2';
const iv = '0505c698405c5a5b34c609c3c7e2fd33';

function encrypt(message) {
  const compressed = zlib.deflateSync(message).toString('binary');
  const cipher = crypto.createCipheriv('aes-256-cbc',
    Buffer.from(secret, 'hex'), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(compressed, 'binary', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv('aes-256-cbc',
    Buffer.from(secret, 'hex'), Buffer.from(iv, 'hex'));
  const decrypted = Buffer.concat([decipher.update(encryptedData, 'hex'), decipher.final()]);
  const decompressed = zlib.inflateSync(decrypted);
  return decompressed.toString();
}

module.exports = {
  encrypt,
  decrypt
};
