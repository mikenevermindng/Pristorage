import { Web3Storage } from 'web3.storage/dist/bundle.esm.min.js'

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGRhMjM1MDYwZUVkNWZBOERFMjlFMjAwN2QwNDkzMEExNGE1ZEZhNjgiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2MzMwNzcxOTU5NzYsIm5hbWUiOiJtYW5obnZfdGVzdCJ9.upuMLynlXF32CxbGpe2MG0DscV8ivvBGyxPPa3ehj50"

function makeStorageClient() {
    return new Web3Storage({ token: TOKEN })
}

async function storeFiles(files, onRootCidReady, onStoredChunk ) {
    const client = makeStorageClient()
    const cid = await client.put(files, { onRootCidReady, onStoredChunk })
    return cid
}

async function retrieveFiles(cid) {
    const client = makeStorageClient()
    const res = await client.get(cid)
    console.log(`Got a response! [${res.status}] ${res.statusText}`)
    if (!res.ok) {
        throw new Error(`failed to get ${cid} - [${res.status}] ${res.statusText}`)
    }

    // unpack File objects from the response
    const files = await res.files()
    return files
}

async function retrieve(cid) {
    const client = makeStorageClient()
    const res = await client.get(cid)
    console.log(`Got a response! [${res.status}] ${res.statusText}`)
    if (!res.ok) {
        throw new Error(`failed to get ${cid}`)
    }

    // request succeeded! do something with the response object here...
}

module.exports = {
    makeStorageClient,
    storeFiles,
    retrieve,
    retrieveFiles
}