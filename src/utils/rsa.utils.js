import cryptico from 'cryptico'

var Bits = 1024;

function createKeyPair(passPhrase) {
    const MattsRSAkey = cryptico.generateRSAKey(passPhrase, Bits); 
    return MattsRSAkey
}

function createPubKeyString(MattsRSAkey) {
    const MattsPublicKeyString = cryptico.publicKeyString(MattsRSAkey);
    return MattsPublicKeyString
}

function rsaEncrypt(PlainText, MattsPublicKeyString) {
    const EncryptionResult = cryptico.encrypt(PlainText, MattsPublicKeyString)
    return EncryptionResult
}

function rsaDecrypt(cipher, MattsRSAkey) {
    const DecryptionResult = cryptico.decrypt(cipher, MattsRSAkey);
    return DecryptionResult
}

module.exports = {
    createKeyPair,
    createPubKeyString,
    rsaEncrypt,
    rsaDecrypt
}

