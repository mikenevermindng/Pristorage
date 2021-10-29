import React, {useState, useEffect} from 'react'
import './style/General.page.css'
import {
    FolderAddOutlined,
    UploadOutlined,
    InboxOutlined,
    DownloadOutlined,
    ShareAltOutlined
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
import {getFolderInfo} from '../store/slice/commonFolder.slice'
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
import { useHistory } from 'react-router-dom';
import ShareFileButton from '../components/ShareFileButton'
import DeleteButton from '../components/DeleteButton'

const { Dragger } = Upload;

const folderValidationSchema = Yup.object().shape({
    name: Yup.string().required('Invalid name'),
});

export default function Home() {

    const [data, setData] = useState([])
    const history = useHistory()

    const dispatch = useDispatch()
    const {loading: commonFolderLoading, current: commonFolderCurrent} = useSelector(state => state.commonFolder)
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)

    const formik = useFormik({
        initialValues: {
            name: '',
        },
        validationSchema: folderValidationSchema,
        onSubmit: async (values) => {
            const id = uuidv4()
            const folder = {
                _id: id, 
                _name: values.name, 
                _parent: commonFolderCurrent.id
            }
            const data = await window.contract.create_folder(folder)
            history.go(0)
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
    
    const handleCancelUpload = () => {
        setIsModalUploadVisible(false);
    };
    
    useEffect(() => {
        const fetchData = async () => {
            const folderId = getUrlParameter('folder')
            if (folderId) {
                dispatch(getFolderInfo(folderId))
            } else {
                const {accountId} = await window.walletConnection.account()
                dispatch(getFolderInfo(accountId))
            }
        }
        fetchData()
    }, [])

    const storeToWeb3Storage = async (files, filename, fileType, encryptedPassword) => {
        const totalSize = files.map(f => f.size).reduce((a, b) => a + b, 0)
        let uploaded = 0

        const onRootCidReady = cid => {
            console.log('upcommonFolderLoading files with cid:', cid)
        }
    
        const onStoredChunk = size => {
            uploaded += size
            const pct = uploaded / totalSize
            console.log(`UpcommonFolderLoading... ${pct.toFixed(2) * 100}% complete`)
        }

        const cid = await storeFiles(files, onRootCidReady, onStoredChunk)
        
        await window.contract.create_file({
            _folder: commonFolderCurrent.id, 
            _file_id: uuidv4(),
            _cid: cid, 
            _name: filename, 
            _encrypted_password: encryptedPassword, 
            _file_type: fileType 
        })
        history.go(0)
    }

    const fileSubmit = async (file) => {
        const worker = new Worker('../worker.js')
        const {encryptByWorker} = wrap(worker)
        const password = uuidv4()
        const encryptedFiles = await encryptByWorker(file, password)
        const MattsRSAkey = createKeyPair(userCurrent.privateKey);
        const MattsPublicKeyString = createPubKeyString(MattsRSAkey)
        const {status, cipher} = rsaEncrypt(password, MattsPublicKeyString)
        if (status === "success") {
            await storeToWeb3Storage(encryptedFiles, file.name, file.type, cipher)
            setIsModalUploadVisible(false)
            history.go(0)
        } else {
            message.error('Fail to encrypt file ' + file.name)
        }
    }

    useEffect(() => {
        const files = commonFolderCurrent.files.map(file => {
            return {
                id: file.cid,
                ...file,
                type: 'File'
            }
        })
        const folders = commonFolderCurrent.children.map(child => {
            return {
                id: child.id,
                ...child,
                type: 'Folder'
            }
        })
        setData([
            {
                name: "...",
                id: commonFolderCurrent.parent
            },
            ...folders, 
            ...files]
        )
    }, [commonFolderCurrent])

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
        history.push(`/?folder=${id}`)
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
                                        const MattsRSAkey = createKeyPair(userCurrent.privateKey);
                                        const {plaintext, status} = rsaDecrypt(record.encrypted_password, MattsRSAkey)
                                        if (status === "success") {
                                            const files = await retrieveFiles(record.cid)
                                            const worker = new Worker('../worker.js')
                                            const {decryptByWorker} = wrap(worker)
                                            const decryptedFile = await decryptByWorker(files, record.name, plaintext)
                                            console.log(decryptedFile)
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

                            <Tooltip title="Share">
                                <ShareFileButton {...{...record, folder: commonFolderCurrent.id}} />
                            </Tooltip>

                            <Tooltip title="Remove">
                                <DeleteButton 
                                    type="File" 
                                    name={record.name} 
                                    handleDelete={() => window.contract.remove_file({_folder: commonFolderCurrent.id, _file: record.id})}
                                />
                            </Tooltip>
                        </div>}
                        {record.type === 'Folder' && <div className="d-flex justify-content-evenly">
                            <Tooltip title="Remove">
                                <DeleteButton 
                                    type="Folder" 
                                    name={record.name} 
                                    handleDelete={() => window.contract.remove_folder({_folder: record.id})}
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
                <h2 className="title">My folders</h2>
                <hr />
            </div>
            <div className="content">
                <div className="actions d-flex justify-content-end">
                    <div className="action-button">
                        <Button 
                            icon={<FolderAddOutlined style={{ fontSize: '18px' }} />} 
                            onClick={showModalCreateFolder} 
                            loading={commonFolderLoading} 
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
                    {commonFolderCurrent.id !== userCurrent.account && <div className="action-button">
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
