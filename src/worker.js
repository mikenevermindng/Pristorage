import { expose } from "comlink";
import {
    encrypt,
    decrypt 
} from "./utils/file.utils"

const worker = {
    encryptByWorker: encrypt,
    decryptByWorker: decrypt
}

expose(worker)