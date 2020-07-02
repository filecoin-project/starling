const crypto = require('crypto');
const fs = require('fs');

function encrypt(path, outputPath, key) {
  return new Promise((resolve, reject) => {
    var cipher = crypto.createCipheriv('aes-256-cbc', key.slice(0, 32), key.slice(0, 16));
    var inputStream = fs.createReadStream(path);
    var outputStream = fs.createWriteStream(outputPath);
    inputStream.pipe(cipher).pipe(outputStream);

    outputStream.on('finish', function() {
      resolve();
    });

    outputStream.on('error', function(error) {
      reject(error);
    });
  });
}

function decrypt(path, outputPath, key) {
  return new Promise((resolve, reject) => {
    var decipher = crypto.createDecipheriv('aes-256-cbc', key.slice(0, 32), key.slice(0, 16));
    var inputStream = fs.createReadStream(path);
    var outputStream = fs.createWriteStream(outputPath);
    inputStream.pipe(decipher).pipe(outputStream);

    outputStream.on('finish', function() {
      resolve();
    });

    outputStream.on('error', function(error) {
      reject(error);
    });
  });
}

function generateEncryptionKey(key) {
  if (!key) {
    return crypto.createHash('sha256').update(crypto.randomBytes(8).toString('hex')).digest('hex');
  }
  return crypto.createHash('sha256').update(key).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  generateEncryptionKey,
};
