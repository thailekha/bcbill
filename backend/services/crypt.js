const crypto = require('crypto');

const secret = 'be864174656596ae7fd818e32236dfddf96f2e335fc18600f0290906a051ebf2';
const iv = '0505c698405c5a5b34c609c3c7e2fd33';

function encrypt(message) {
  const cipher = crypto.createCipheriv('aes-256-cbc',
    Buffer.from(secret, 'hex'), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(message, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv('aes-256-cbc',
    Buffer.from(secret, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt
};
