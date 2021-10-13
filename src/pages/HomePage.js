import React, {useEffect, useState} from 'react'
import {storeFiles, retrieveFiles} from '../utils/web3.storage'
import cryptico from 'cryptico'
import {wrap} from 'comlink'
import {ConcatenateBlobs, saveFile} from '../utils/file.utils'

export default function HomePage() {

    var PassPhrase = "The Moon is a a private key"; 

    var Bits = 1024; 
    
    var MattsRSAkey = cryptico.generateRSAKey(PassPhrase, Bits);

    var MattsPublicKeyString = cryptico.publicKeyString(MattsRSAkey);  


    var PlainText = "Matt, I need you to help me with my Starcraft strategy.";

    var EncryptionResult = cryptico.encrypt(PlainText, MattsPublicKeyString);


    var DecryptionResult = cryptico.decrypt(EncryptionResult.cipher, MattsRSAkey);


    const encryptCallback = async (files) => {
        const time1 = Date.now()
        const totalSize = files.map(f => f.size).reduce((a, b) => a + b, 0)
        let uploaded = 0

        const onRootCidReady = cid => {
            console.log('uploading files with cid:', cid)
        }
    
        const onStoredChunk = size => {
            uploaded += size
            const pct = uploaded / totalSize
            console.log(`Uploading... ${pct.toFixed(2) * 100}% complete`)
        }

        const cid = await storeFiles(files, onRootCidReady, onStoredChunk)
        const time2 = Date.now()
        console.log(time2 - time1)
    }


    const fileSubmit = async (event) => {
        event.preventDefault()
        let files = document.getElementById("file").files;
        const worker = new Worker('../worker.js')
        console.log(worker)
        const {encryptByWorker, decryptByWorker} = wrap(worker)
        console.log(encryptByWorker)
        const encryptedFiles = await encryptByWorker(files[0])
        const decryptedFile = await decryptByWorker(encryptedFiles)
        ConcatenateBlobs(decryptedFile, files[0].type, (blob) => {
            saveFile(blob, files[0].name)
        })
    }

    const fileRetrieve = async (event) => {
        event.preventDefault()
        let cid = document.getElementById("cid").value;
        const files = await retrieveFiles(cid)
        console.log(files)
        files.forEach(file => {
            // decrypt(file, null)
        })
    }


    return (
        <>
        <form method="post" encType="multipart/form-data" onSubmit={fileSubmit}>
            <div style={{ display: 'flex' }}>
            <div>
                <input type="file" id="file" name="file" />
            </div>
            <div>
                <button>Submit</button>
            </div>
            </div>
        </form>

        <form method="post" encType="multipart/form-data" onSubmit={fileRetrieve}>
            <div style={{ display: 'flex' }}>
            <div>
                <input type="text" id="cid" name="cid" />
            </div>
            <div>
                <button>Submit</button>
            </div>
            </div>
        </form>
        </>
    )
}
