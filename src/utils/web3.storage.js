import { Web3Storage } from 'web3.storage/dist/bundle.esm.min.js'

function makeStorageClient(TOKEN) {
    return new Web3Storage({ token: TOKEN })
}

async function storeFiles(TOKEN, files, onRootCidReady, onStoredChunk ) {
    const client = makeStorageClient(TOKEN)
    const cid = await client.put(files, { onRootCidReady, onStoredChunk })
    return cid
}

async function retrieveFiles(TOKEN, cid) {
    const client = makeStorageClient(TOKEN)
    const res = await client.get(cid)
    console.log(`Got a response! [${res.status}] ${res.statusText}`)
    if (!res.ok) {
        throw new Error(`failed to get ${cid} - [${res.status}] ${res.statusText}`)
    }

    // unpack File objects from the response
    const files = await res.files()
    return files
}

async function retrieve(TOKEN, cid) {
    const client = makeStorageClient(TOKEN)
    const res = await client.get(cid)
    console.log(`Got a response! [${res.status}] ${res.statusText}`)
    if (!res.ok) {
        throw new Error(`failed to get ${cid}`)
    }

    // request succeeded! do something with the response object here...
}

async function checkFileStatus(TOKEN, cid) {
    const client = makeStorageClient(TOKEN)
    const status = await client.status(cid)
    if (status) {
        console.log(status)
    }
}

async function validateToken(token) {
    const web3storage = new Web3Storage({ token })
    try {
        for await (const _ of web3storage.list({ maxResults: 1})) {
            break
        }
        return true
    } catch (e) {
        return false
    }
}

module.exports = {
    makeStorageClient,
    storeFiles,
    retrieve,
    retrieveFiles,
    checkFileStatus,
    validateToken
}