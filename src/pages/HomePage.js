import React, {useEffect, useState} from 'react'
import {
    storeFiles, 
    retrieveFiles,
    checkFileStatus,
    validateToken
} from '../utils/web3.storage'
import cryptico from 'cryptico'
import {wrap} from 'comlink'
import {concatenateBlobs, saveFile} from '../utils/file.utils'
import {
    createKeyPair,
    createPubKeyString,
    rsaEncrypt,
    rsaDecrypt
} from '../utils/rsa.utils'
import { Modal, Button, Input } from 'antd';
import {useFormik } from 'formik';
import * as Yup from 'yup';

const signupValidationSchema = Yup.object().shape({
    password: Yup.string().min(8, "Mật khẩu tối thiểu 8 kí tự").required('Mật khẩu không được bổ trống'),
    token: Yup.string().test('Validate token', 'Token không hợp lệ', value => {
        return new Promise((resolve, reject) => {
            validateToken(value).then(result => {
                console.log(result);
                resolve(result)
            })
        });
        
    }).required('Web3 storage token không được bổ trống')
});


const { TextArea } = Input;

export default function HomePage() {

    async function getAccountInfo() {
        const account = await window.walletConnection.account()
        const account_id = account.accountId
        const root = await  window.contract.get_folder_info({folder_id: account_id})
        console.log(root)
        const rootSharedFolder = await window.contract.get_shared_folder_info({folder_id: account_id})
        console.log(rootSharedFolder)
        const user = await window.contract.get_user({account_id})
        return user
    }

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const showModal = () => {
        setIsModalVisible(true);
    };
    
    const handleOk = () => {
        handleSubmit()
    };
    
    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const formik = useFormik({
        initialValues: {
            password: '',
            token: '',
        },
        validationSchema: signupValidationSchema,
        onSubmit: async () => {
            setLoading(true);
            const MattsRSAkey = createKeyPair(values.password);
            const MattsPublicKeyString = createPubKeyString(MattsRSAkey)
            const encryptedToken = rsaEncrypt(values.token, MattsPublicKeyString)
            const {cipher, status} = encryptedToken
            if (status === "success") {
                window.localStorage.setItem('private_key', values.password)
                window.localStorage.setItem('web3_storage_token', values.token)
                await window.contract.sign_up({public_key: MattsPublicKeyString, encrypted_token: cipher})
                setIsModalVisible(false);
            }
        }
    })

    const {values, errors, handleChange, handleSubmit, setFieldValue} = formik

    useEffect(() => {
        const checkBeforeEnter = async () => {
            const user = await getAccountInfo()
            console.log(user)
            if (!user) {
                showModal()
            }
        }
        checkBeforeEnter()
    }, [])

    // console.log(createKeyPair('manhnv').toJSON())

    const storeToWeb3Storage = async (files) => {
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
        const uploaded = files[0]
        const worker = new Worker('../worker.js')
        const {encryptByWorker} = wrap(worker)
        const encryptedFiles = await encryptByWorker(uploaded)
        storeToWeb3Storage(encryptedFiles)
    }

    const fileRetrieve = async (event) => {
        event.preventDefault()
        let cid = document.getElementById("cid").value;
        const files = await retrieveFiles(cid)
        console.log(files)
        const worker = new Worker('../worker.js')
        const {decryptByWorker} = wrap(worker)
        const decryptedFile = await decryptByWorker(files)
        console.log(decryptedFile)
        concatenateBlobs(decryptedFile, 'application/x-msdownload', (blob) => {
            saveFile(blob, 'ZaloSetup-21.10.1.exe')
        })
    }

    const checkFileStatusByCid = async (event) => {
        event.preventDefault()
        let cid = document.getElementById("file-check-cid").value;
        checkFileStatus(cid)
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
                <button>download</button>
            </div>
            </div>
        </form>

        <form onSubmit={checkFileStatusByCid}>
            <div style={{ display: 'flex' }}>
            <div>
                <input type="text" id="file-check-cid" name="cid" />
            </div>
            <div>
                <button>check status</button>
            </div>
            </div>
        </form>
        <Modal
            visible={isModalVisible}
            title="Bạn cần nhập Web3 Storage và Mật khẩu để xử dụng ứng dụng"
            onOk={handleOk}
            footer={[
                <Button
                    loading={loading}
                    type="primary"
                    onClick={handleOk}
                    key="signup button"
                >
                    SignUp
                </Button>,
            ]}
        >
            <div className="input-group mb-3">
                <label className="form-label">Mật khẩu</label>
                <Input 
                    placeholder="Mật khẩu"
                    onChange={handleChange('password')}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
            </div>
            <div className="input-group mb-3">
                <label className="form-label">Web3Storage Token</label>
                <TextArea 
                    placeholder="Web3Storage Token" 
                    onChange={handleChange('token')}
                />
                {errors.token && <span className="error-text">{errors.token}</span>}
            </div>
        </Modal>
        </>
    )
}
