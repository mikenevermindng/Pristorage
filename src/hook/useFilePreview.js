import {useState} from 'react';
import {
    retrieveFiles,
} from '../utils/web3.storage'
import {
    concatenateBlobs, 
    createFileUrl
} from '../utils/file.utils'
import {
    decryptStringTypeData
} from '../utils/keypair.utils'
import { 
    useSelector, 
} from 'react-redux';
import {wrap} from 'comlink'
import {message} from 'antd'


const useFilePreview = () => {

    const [loading, setLoading] = useState(false)
    const [fileUrl, setFileUrl] = useState("")
    const [fileType, setFileType] = useState(null)
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)
    const [previewing, setPreviewing] = useState(false)
    
    const downloadAndCreateUrl = async (cid, encryptedPassword, name, fileType) => {
        message.info('Wait for file to be ready')
        const {plaintext, success} = await decryptStringTypeData(userCurrent.privateKey, encryptedPassword)
        if (success) {
            const files = await retrieveFiles(userCurrent.web3token, cid)
            const worker = new Worker('../worker.js')
            const {decryptByWorker} = wrap(worker)
            const decryptedFile = await decryptByWorker(files, name, plaintext)
            concatenateBlobs(decryptedFile, fileType, (blob) => {
                const url = createFileUrl(blob)
                window.open(url);
                setFileUrl(url)
                setLoading(false)
            })
        } else {
            message.error('Fail to download file')
        }
    }

    const preview = async (cid, encryptedPassword, name, fileType) => {
        setLoading(true)
        setFileType('png')
        setPreviewing(true)
        await downloadAndCreateUrl(cid, encryptedPassword, name, fileType)
    }

    return {
        loading,
        preview,
        previewing,
        fileUrl,
        fileType,
        setPreviewing
    }
}

export default useFilePreview