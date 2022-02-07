import CryptoJS from "crypto-js"

const FILE_MAX_SIZE = 30000 * 1024

function createChunks(file,cSize) {
    let startPointer = 0;
    let endPointer = file.size;
    let chunks = [];
    while(startPointer<endPointer){
        let newStartPointer = startPointer+cSize;
        chunks.push(file.slice(startPointer,newStartPointer));
        startPointer = newStartPointer;
    }
    return chunks;
}

function concatenateBlobs(blobs, type, callback) {
    var buffers = [];

    var index = 0;

    function readAsArrayBuffer() {
        if (!blobs[index]) {
            return concatenateBuffers();
        }
        var reader = new FileReader();
        reader.onload = function(event) {
            buffers.push(event.target.result);
            index++;
            readAsArrayBuffer();
        };
        reader.readAsArrayBuffer(blobs[index]);
    }

    readAsArrayBuffer();


    function audioLengthTo32Bit(n) {
        n = Math.floor(n);
        var b1 = n & 255;
        var b2 = (n >> 8) & 255;
        var b3 = (n >> 16) & 255;
        var b4 = (n >> 24) & 255;
        return [b1, b2, b3, b4];
    }

    function concatenateBuffers() {
        var byteLength = 0;
        buffers.forEach(function(buffer) {
            byteLength += buffer.byteLength;
        });

        var tmp = new Uint8Array(byteLength);
        var lastOffset = 0;
        var newData;
        buffers.forEach(function(buffer) {
            if (type=='audio/wav' && lastOffset >  0) newData = new Uint8Array(buffer, 44);
            else newData = new Uint8Array(buffer);
            tmp.set(newData, lastOffset);
            lastOffset += newData.length;
        });
        if (type=='audio/wav') {
            tmp.set(audioLengthTo32Bit(lastOffset - 8), 4);
            tmp.set(audioLengthTo32Bit(lastOffset - 44), 40); // update audio length in the header
        }
        var blob = new Blob([tmp.buffer], {
            type: type
        });
        callback(blob);         
    }
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function saveFile(blob, filename) {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    var url = window.URL.createObjectURL(blob);
    console.log(url);
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function getArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    })
}

function getSplittedEncodeFiles(file) {
    const chunks = createChunks(file, FILE_MAX_SIZE)
    const files = chunks.map((chunk, index) => {
        return new File([chunk], `${index}_${file.name}`)
    })
    return files
}

async function encryptSingleFile(file, password) {
    var key = password;
    const arrayBuffer = await getArrayBuffer(file)
    var wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    var encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
    var fileEnc = new Blob([encrypted]);
    console.log(`encrypted file ${file.name}`)
    return new File([fileEnc], file.name + ".enc");
}

function encrypt(file, password) {
    const files = getSplittedEncodeFiles(file)
    return Promise.all(files.map(file => {
        return encryptSingleFile(file, password)
    }))
}

function convertWordArrayToUint8Array(wordArray) {
    var arrayOfWords = wordArray.hasOwnProperty("words") ? wordArray.words : [];
    var length = wordArray.hasOwnProperty("sigBytes") ? wordArray.sigBytes : arrayOfWords.length * 4;
    var uInt8Array = new Uint8Array(length), index=0, word, i;
    for (i=0; i<length; i++) {
        word = arrayOfWords[i];
        uInt8Array[index++] = word >> 24;
        uInt8Array[index++] = (word >> 16) & 0xff;
        uInt8Array[index++] = (word >> 8) & 0xff;
        uInt8Array[index++] = word & 0xff;
    }
    return uInt8Array;
}

function getFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    })
}

async function decrypt(files, fileName, password) {
    const decryptedFiles = await Promise.all(files.map(file => {
        return decryptSingleFile(file, password)
    }))
    return decryptedFiles
}

async function decryptSingleFile(file, password) {
    console.log(file)
    var key = password;  
    console.log(key)
    const textFile = await getFileAsText(file) 
    var decrypted = CryptoJS.AES.decrypt(textFile, key);
    console.log(decrypted)
    var typedArray = convertWordArrayToUint8Array(decrypted);
    var fileDec = new Blob([typedArray]);
    return fileDec
}



module.exports = {
    encrypt,
    decrypt,
    concatenateBlobs,
    saveFile
}