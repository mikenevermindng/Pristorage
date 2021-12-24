import React, {useState, useEffect} from 'react'
import './style/General.page.css'
import {
    DownloadOutlined,
    FolderOpenOutlined,
    FileProtectOutlined,
    FolderAddOutlined,
    UploadOutlined,
    InboxOutlined,
} from '@ant-design/icons';
import { 
    Table, 
    Tabs,
    Tooltip,
    Button,
    Input,
    Modal,
    Upload,
    message 
} from 'antd';
import { 
    useSelector, 
    useDispatch 
} from 'react-redux';
import {
    getSharedFoldersWithMeInfo, 
    getSharedFolderById
} from '../store/slice/sharedFolderWithMe.slice'
import {
    getPublicKeyByPrivateKey,
    encryptStringTypeData,
    decryptStringTypeData
} from '../utils/keypair.utils'
import {
    storeFiles, 
    retrieveFiles,
    checkFileStatus,
    validateToken
} from '../utils/web3.storage'
import {wrap} from 'comlink'
import {concatenateBlobs, saveFile} from '../utils/file.utils'
import {getUrlParameter} from '../utils/url.utils'
import {useHistory} from 'react-router-dom'
import {getSharedFileInfo} from '../store/slice/sharedFileWithMe.slice'
import { unwrapResult } from '@reduxjs/toolkit'
import {useFormik } from 'formik';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';

const { TabPane } = Tabs;
const { Dragger } = Upload;

const folderValidationSchema = Yup.object().shape({
    name: Yup.string().required('Invalid folder name'),
});

export default function SharedWithMe() {

    const history = useHistory()

    const [data, setData] = useState([])
    const dispatch = useDispatch()
    const {current: foldersSharedWithMe, loading: foldersSharedWithMeLoading, root: rootFoldersSharedToMe } = useSelector(state => state.sharedFolderWithMe)
    const {current: filesSharedWithMe, loading: filesSharedWithMeLoading} = useSelector(state => state.sharedFileWithMe)
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)
    const [permission, setPermission] = useState(1)

    const formik = useFormik({
        initialValues: {
            name: '',
        },
        validationSchema: folderValidationSchema,
        onSubmit: async (values) => {
            const folder_password = uuidv4()
            const {success, cipher} = await encryptStringTypeData(userCurrent.publicKey, folder_password)
            if (success) {
                const id = uuidv4()
                const {accountId} = await window.walletConnection.account()
                const currentTimeStamp = new Date().getTime()
                const folder = {
                    _id: id, 
                    _name: values.name, 
                    _parent: foldersSharedWithMe.id,
                    _password: cipher,
                    _account_id: accountId,
                    _created_at: currentTimeStamp,
                }
                await window.contract.create_shared_folder(folder)
                history.go(0)
            } else {
                message.error('fail to encode password')
            }
            
        }
    })

    const {values, errors, handleChange, handleSubmit, setFieldValue} = formik

    const [isModalCreateFolderVisible, setIsModalCreateFolderVisible] = useState(false);
    const [isModalUploadVisible, setIsModalUploadVisible] = useState(false);

    const showModalCreateFolder = () => {
        setIsModalCreateFolderVisible(true);
    };
    
    const handleCancelCreateFolder = () => {
        setIsModalCreateFolderVisible(false);
    };

    const showModalUpload = () => {
        setIsModalUploadVisible(true);
    };
    
    const handleUpload = () => {
        setIsModalUploadVisible(false);
    };
    
    const handleCancelUpload = () => {
        setIsModalUploadVisible(false);
    };

    const storeToWeb3Storage = async (files, filename, fileType, encryptedPassword) => {
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

        const cid = await storeFiles(userCurrent.web3token, files, onRootCidReady, onStoredChunk)
        const currentTimeStamp = new Date().getTime()
        await window.contract.create_shared_folder_file({
            _folder: foldersSharedWithMe.id, 
            _file_id: uuidv4(),
            _cid: cid, 
            _name: filename, 
            _file_type: fileType,
            _last_update: currentTimeStamp
        })
        history.go(0)
    }

    const fileSubmit = async (file) => {
        console.log(foldersSharedWithMe)
        const {rootId} = foldersSharedWithMe
        const rootFolder = rootFoldersSharedToMe.find(folder => folder.id === rootId)
        if (rootFolder) {
            const {sharedPassword: folderPassword} = rootFolder
            const {success, plaintext: folderDecryptedPassword} = await decryptStringTypeData(userCurrent.privateKey, folderPassword)
            if (success) {
                const worker = new Worker('../worker.js')
                const {encryptByWorker} = wrap(worker)
                const encryptedFiles = await encryptByWorker(file, folderDecryptedPassword)
                await storeToWeb3Storage(encryptedFiles, file.name, file.type)
                setIsModalUploadVisible(false)
                history.go(0)
            } else {
                message.error('Fail to encrypt file ' + file.name)
            }
        }
    }
    
    useEffect(() => {
        const fetchData = async () => {
            await dispatch(getSharedFoldersWithMeInfo());
            const folderId = getUrlParameter('folder')
            const owner = getUrlParameter('owner')
            if (folderId && owner) {
                const res = await dispatch(getSharedFolderById({id: folderId, owner: owner}))
            } else {
                console.log('calling function')
                await dispatch(getSharedFileInfo());
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        if (rootFoldersSharedToMe.length && foldersSharedWithMe?.rootId) {
            const {rootId} = foldersSharedWithMe
            const sharedDoc = rootFoldersSharedToMe.find(doc => doc.id === rootId)
            if (sharedDoc) {
                setPermission(sharedDoc.permissions)
            }
        } 
    }, [rootFoldersSharedToMe, foldersSharedWithMe])

    const redirectToFolder = (id, owner) => {
        if (id === owner) {
            history.push(`/shared_with_me`)
            history.go(0)
        } else {
            history.push(`/shared_with_me?folder=${id}&owner=${owner}`)
            history.go(0)
        }
        
    }

    const downloadFileInSharedFolder = async (record) => {
        const {rootId} = foldersSharedWithMe
        const sharedDoc = rootFoldersSharedToMe.find(doc => doc.id === rootId)
        if (sharedDoc) {
            const {sharedPassword} = sharedDoc
            const {plaintext, success} = await decryptStringTypeData(userCurrent.privateKey, sharedPassword)
            if (success) {
                const files = await retrieveFiles(userCurrent.web3token, record.cid)
                const worker = new Worker('../worker.js')
                const {decryptByWorker} = wrap(worker)
                const decryptedFile = await decryptByWorker(files, record.name, plaintext)
                console.log(decryptedFile)
                concatenateBlobs(decryptedFile, record.file_type, (blob) => {
                    saveFile(blob, record.name)
                })
            } else {
                message.error('Fail to decrypt folder password')
            }
        } else {
            message.error('Fail to decrypt folder password')
        }
    }

    const downloadSharedFile = async (record) => {
        const {plaintext, success} = await decryptStringTypeData(userCurrent.privateKey, record.sharedPassword)
        if (success) {
            const files = await retrieveFiles(userCurrent.web3token, record.cid)
            const worker = new Worker('../worker.js')
            const {decryptByWorker} = wrap(worker)
            const decryptedFile = await decryptByWorker(files, record.name, plaintext)
            console.log(decryptedFile)
            concatenateBlobs(decryptedFile, record.file_type, (blob) => {
                saveFile(blob, record.name)
            })
        } else {
            message.error('fail to download file')
        }
    }

    const download = async (record) => {
        if (record.isSharedFolderFile) {
            await downloadFileInSharedFolder(record)
        } else {
            await downloadSharedFile(record)
        }
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            render(text, record) {
                return (
                    <div>
                        {record.isFolder  ? 
                            <a onClick={() => redirectToFolder(record.id, record.owner)}>{!record.isTop && <FolderOpenOutlined />} {record.name}</a>:
                            <span><FileProtectOutlined /> {record.name}</span>
                        }
                    </div>
                )
            }
        },
        {
            title: 'Type',
            dataIndex: 'file_type',
        },
        {
            title: 'Owner',
            dataIndex: 'owner',
            render(text, record) {
                return <span>{record.isTop ? "" : record.owner}</span>
            }
        },
        {
            title: '',
            render(text, record) {
                return (
                    <div>
                        {!record.isFolder  && !record.isTop && <div className="d-flex justify-content-evenly">
                            <Tooltip title="Download">
                                <Button onClick={() => download(record)}>
                                    <DownloadOutlined />
                                </Button>
                            </Tooltip>
                        </div>}
                    </div>
                )
            }
        },
    ];

    useEffect(() => {
        const files = foldersSharedWithMe.files.map(file => {
            return {
                id: file.cid,
                ...file,
                isFolder: false,
                isSharedFolderFile: true,
            }
        })
        const folders = foldersSharedWithMe.children.map(child => {
            return {
                id: child.id,
                ...child,
                isFolder: true,
                children: null,
            }
        })
        const sharedFiles = filesSharedWithMe.map(file => {
            return {
                id: file.cid,
                ...file,
                isFolder: false,
                isSharedFolderFile: false,
            }
        })
        console.log(filesSharedWithMe, sharedFiles)
        if (foldersSharedWithMe.owner === foldersSharedWithMe.parent) {
            setData([
                {
                    name: "...",
                    id: foldersSharedWithMe.parent,
                    owner: foldersSharedWithMe.owner,
                    isFolder: true,
                    isTop: true
                },
                ...folders, 
                ...files,
                ...sharedFiles
            ])
        } else {
            setData([
                {
                    name: "...",
                    id: foldersSharedWithMe.parent,
                    owner: foldersSharedWithMe.owner,
                    isFolder: true,
                    isTop: true
                },
                ...folders, 
                ...files,
                ...sharedFiles
            ])
        }
    }, [foldersSharedWithMe, filesSharedWithMe])

    const props = {
        name: 'file',
        multiple: false,
        onChange(info) {
            const { status } = info.file;
            if (status !== 'uploading') {
                fileSubmit(info.file.originFileObj)
            }
        },
        onDrop(e) {
            console.log('Dropped files', e.dataTransfer.files);
            fileSubmit(e.dataTransfer.files[0])
        },
    };

    return (
        <>
        <div>
            <div className="header">
                <h2 className="title">Shared with me</h2>
                <hr />
            </div>
            <div className="content">
                {permission === 2 && <div className="actions d-flex justify-content-end">
                    <div className="action-button">
                        <Button 
                            icon={<FolderAddOutlined style={{ fontSize: '18px' }} />} 
                            onClick={showModalCreateFolder} 
                        >
                            Create folder
                        </Button>
                        <Modal 
                            title="Create folder" 
                            visible={isModalCreateFolderVisible} 
                            onOk={handleSubmit} 
                            onCancel={handleCancelCreateFolder}
                        >
                            <label className="form-label">Folder name</label>
                            <div className="input-group mb-3">
                                <Input placeholder="Folder name" onChange={handleChange('name')} />
                            </div>
                            {errors.name && <span className="error-text">{errors.name}</span>}
                        </Modal>
                    </div>
                    <div className="action-button">
                        <Button 
                            icon={<UploadOutlined style={{ fontSize: '18px' }} />} 
                            onClick={showModalUpload}
                        >
                            Upload file
                        </Button>
                        <Modal 
                            title="Upload file" 
                            visible={isModalUploadVisible} 
                            onCancel={handleCancelUpload}
                            footer={[]}
                        >
                            <Dragger {...props}>
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                {/* <p className="ant-upload-hint">
                                    Support for a single or bulk upload. Strictly prohibit from uploading company data or other
                                    band files
                                </p> */}
                            </Dragger>,
                        </Modal>
                    </div>
                </div>}
                <div className="list-items mt-3">
                    <div className="mt-3">
                        <Table 
                            columns={columns} 
                            dataSource={data} 
                            rowKey={(record) => record.id}  
                        />
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}
