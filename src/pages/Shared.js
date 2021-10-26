import React, {useState, useEffect} from 'react'
import './style/General.page.css'
import {
    FolderAddOutlined,
    UploadOutlined,
    InboxOutlined,
    DownloadOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { 
    Button, 
    Table, 
    Modal, 
    Input, 
    Upload, 
    message, 
    Tooltip 
} from 'antd';
import { 
    useSelector, 
    useDispatch 
} from 'react-redux';
import {getSharedFolderInfo} from '../store/slice/sharedFolder.slice'
import { v4 as uuidv4 } from 'uuid';
import {wrap} from 'comlink'
import {useFormik } from 'formik';
import * as Yup from 'yup';
import {
    storeFiles, 
    retrieveFiles,
    checkFileStatus,
    validateToken
} from '../utils/web3.storage'
import {
    createKeyPair,
    createPubKeyString,
    rsaEncrypt,
    rsaDecrypt
} from '../utils/rsa.utils'
import {concatenateBlobs, saveFile} from '../utils/file.utils'
import {getUrlParameter} from '../utils/url.utils'
import {useHistory} from 'react-router-dom'
import ShareFolderButton from '../components/ShareFolderButton'
import DeleteButton from '../components/DeleteButton'

const { Dragger } = Upload;

const folderValidationSchema = Yup.object().shape({
    name: Yup.string().required('Invalid folder name'),
});

export default function Shared() {
    const [data, setData] = useState([])

    const dispatch = useDispatch()
    const history = useHistory()
    const {loading, current} = useSelector(state => state.sharedFolder)
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)

    const formik = useFormik({
        initialValues: {
            name: '',
        },
        validationSchema: folderValidationSchema,
        onSubmit: async (values) => {
            const folder_password = uuidv4()
            const MattsRSAkey = createKeyPair(userCurrent.privateKey);
            const MattsPublicKeyString = createPubKeyString(MattsRSAkey)
            const {status, cipher} = rsaEncrypt(folder_password, MattsPublicKeyString)
            if (status === "success") {
                const id = uuidv4()
                const {accountId} = await window.walletConnection.account()
                const folder = {
                    _id: id, 
                    _name: values.name, 
                    _parent: current.id,
                    _password: cipher,
                    _account_id: accountId
                }
                const data = await window.contract.create_shared_folder(folder)
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
    
    useEffect(() => {
        const fetchData = async () => {
            const folderId = getUrlParameter('folder')
            if (folderId) {
                dispatch(getSharedFolderInfo(folderId))
            } else {
                const {accountId} = await window.walletConnection.account()
                dispatch(getSharedFolderInfo(accountId))
            }
        }
        fetchData()
    }, [])

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

        const cid = await storeFiles(files, onRootCidReady, onStoredChunk)
        
        await window.contract.create_shared_folder_file({
            _folder: current.id, 
            _file_id: uuidv4(),
            _cid: cid, 
            _name: filename, 
            _file_type: fileType 
        })
        history.go(0)
    }

    const fileSubmit = async (file) => {
        const {root} = current
        if (root) {
            const {folder_password: folderPassword} = root
            const MattsRSAkey = createKeyPair(userCurrent.privateKey);
            const {status, plaintext: folderDecryptedPassword} = rsaDecrypt(folderPassword, MattsRSAkey)
            if (status === "success") {
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
        const files = current.files.map(file => {
            return {
                id: file.cid,
                ...file,
                type: 'File'
            }
        })
        const folders = current.children.map(child => {
            return {
                id: child.id,
                ...child,
                type: 'Folder'
            }
        })
        setData([
            {
                name: "...",
                id: current.parent
            },
            ...folders, 
            ...files]
        )
    }, [current])

    const props = {
        name: 'file',
        multiple: true,
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

    const redirectToFolder = (id) => {
        history.push(`/shared?folder=${id}`)
        history.go(0)
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            render(text, record) {
                return (
                    <div>
                        {record.type !== 'File'  ? 
                            <a onClick={() => redirectToFolder(record.id)}>{record.name}</a>:
                            <span>{record.name}</span>
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
            title: 'Folder/File',
            dataIndex: 'type',
        },
        {
            title: '',
            render(text, record) {
                return (
                    <div>
                        {record.type === 'File' && <div className="d-flex justify-content-evenly">
                            <Tooltip title="Download">
                                <Button
                                    onClick={async () => {
                                        const {root} = current
                                        const MattsRSAkey = createKeyPair(userCurrent.privateKey);
                                        const {plaintext, status} = rsaDecrypt(root.folder_password, MattsRSAkey)
                                        if (status === "success") {
                                            const files = await retrieveFiles(record.cid)
                                            const worker = new Worker('../worker.js')
                                            const {decryptByWorker} = wrap(worker)
                                            const decryptedFile = await decryptByWorker(files, record.name, plaintext)
                                            concatenateBlobs(decryptedFile, record.file_type, (blob) => {
                                                saveFile(blob, record.name)
                                            })
                                        } else {
                                            message.error('Fail to download file')
                                        }
                                    }}
                                >
                                    <DownloadOutlined />
                                </Button>
                            </Tooltip>
                            <Tooltip title="Remove">
                                <DeleteButton 
                                    type="File" 
                                    name={record.name} 
                                    handleDelete={() => window.contract.remove_shared_file({_folder: current.id, _file: record.id})}
                                />
                            </Tooltip>
                        </div>}
                        {record.type === 'Folder' && <div className="d-flex justify-content-evenly">
                            {current.root === null && <Tooltip title="Share">
                                <ShareFolderButton {...record} />
                            </Tooltip>}
                            <Tooltip title="Remove">
                                <DeleteButton 
                                    type="Folder" 
                                    name={record.name} 
                                    handleDelete={() => window.contract.remove_shared_folder({_folder: record.id})}
                                />
                            </Tooltip>
                        </div>}
                    </div>
                )
            }
        },
    ];

    return (
        <>
        <div id="homepage">
            <div className="header">
                <h2 className="title">Shared folder</h2>
                <hr />
            </div>
            <div className="content">
                <div className="actions d-flex justify-content-end">
                    <div className="action-button">
                        <Button 
                            icon={<FolderAddOutlined style={{ fontSize: '18px' }} />} 
                            onClick={showModalCreateFolder} 
                            loading={loading} 
                        >
                            Create folder
                        </Button>
                        <Modal 
                            title="Tạo thư mục" 
                            visible={isModalCreateFolderVisible} 
                            onOk={handleSubmit} 
                            onCancel={handleCancelCreateFolder}
                        >
                            <label className="form-label">Folder name</label>
                            <div className="input-group mb-3">
                                <Input placeholder="Tên thư mục" onChange={handleChange('name')} />
                            </div>
                            {errors.name && <span className="error-text">{errors.name}</span>}
                        </Modal>
                    </div>
                    {current.id !== userCurrent.account && <div className="action-button">
                        <Button 
                            icon={<UploadOutlined style={{ fontSize: '18px' }} />} 
                            onClick={showModalUpload}
                        >
                            Upload file
                        </Button>
                        <Modal 
                            title="Tạo thư mục" 
                            visible={isModalUploadVisible} 
                            onCancel={handleCancelUpload}
                            footer={[]}
                        >
                            <Dragger {...props}>
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                <p className="ant-upload-hint">
                                    Support for a single or bulk upload. Strictly prohibit from uploading company data or other
                                    band files
                                </p>
                            </Dragger>,
                        </Modal>
                    </div>}
                </div>
                <div className="list-items mt-3">
                    <Table 
                        columns={columns} 
                        dataSource={data} 
                        rowKey={(record) => record.id} 
                    />
                </div>
            </div>
        </div>
        </>
    )
}
