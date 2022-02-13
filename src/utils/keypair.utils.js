const EthCrypto = require('eth-crypto');

function createKeyPair() {
    const {privateKey, publicKey} = EthCrypto.createIdentity();
    return {privateKey, publicKey}
}

function getPublicKeyByPrivateKey(privateKey) {
    return EthCrypto.publicKeyByPrivateKey(privateKey)
}

async function encryptStringTypeData(publicKey, data) {
    try {
        const encrypted = await EthCrypto.encryptWithPublicKey(
            publicKey,
            data
        );
        const cipher = EthCrypto.cipher.stringify(encrypted)
        return {success: true, cipher}
    } catch(error) {
        return {success: false, error: error.message}
    } 
}

async function decryptStringTypeData(privateKey, data) {
    try {
        const cipher = EthCrypto.cipher.parse(data)
        const encrypted = await EthCrypto.decryptWithPrivateKey(
            privateKey,
            cipher
        );
        return {success: true, plaintext: encrypted}
    } catch(error) {
        return {success: false, error: error.message}
    } 
}

module.exports = {
    createKeyPair,
    getPublicKeyByPrivateKey,
    encryptStringTypeData,
    decryptStringTypeData
}