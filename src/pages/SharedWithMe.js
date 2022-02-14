import React, {useState, useEffect} from 'react'
import './style/General.page.css'
import {
    DownloadOutlined,
    FolderOpenOutlined,
    FileProtectOutlined,
    FolderAddOutlined,
    UploadOutlined,
    InboxOutlined,
    ArrowLeftOutlined
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
} from 'react-redux';
import {
    encryptStringTypeData,
} from '../utils/keypair.utils'
import {useHistory} from 'react-router-dom'
import {useFormik } from 'formik';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import useFetchSharedDocs from '../hook/useFetchSharedDoc'
import useFileCreate from '../hook/useFileCreate'
import useDownloadFile from '../hook/useDownloadFile'
import useFilePreview from '../hook/useFilePreview'

const { Dragger } = Upload;

const folderValidationSchema = Yup.object().shape({
    name: Yup.string().required('Invalid folder name'),
});

export default function SharedWithMe() {

    const history = useHistory()

    const [data, setData] = useState([])
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)
    const {
        loading: folderLoading, 
        current: folderCurrent, 
        root: rootFolder,
        folderId: currentFolderId,
        parentFolder,
        permission
    } = useSelector(state => state.sharedWithMe)
    const {loading: submitting, fileSubmit} = useFileCreate()
    const {loading: downloading, download} = useDownloadFile()
    useFetchSharedDocs()
    const {
        preview
    } = useFilePreview()
    
    const formik = useFormik({
        initialValues: {
            name: '',
        },
        validationSchema: folderValidationSchema,
        onSubmit: async (values) => {
            const currentTimeStamp = new Date().getTime()
            const id = uuidv4()
            const {accountId} = await window.walletConnection.account()
            const folder = {
                _id: id, 
                _name: values.name, 
                _parent: currentFolderId,
                _password: null,
                _created_at: currentTimeStamp,
                _type: null,
            }
            await window.contract.create_folder_v2(folder)
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
    
    const handleUpload = () => {
        setIsModalUploadVisible(false);
    };
    
    const handleCancelUpload = () => {
        setIsModalUploadVisible(false);
    };

    const props = {
        name: 'file',
        multiple: false,
        onChange(info) {
            const { status } = info.file;
            if (status !== 'uploading') {
                fileSubmit(info.file.originFileObj, rootFolder, currentFolderId)
            }
        },
        onDrop(e) {
            console.log('Dropped files', e.dataTransfer.files);
            fileSubmit(e.dataTransfer.files[0])
        },
    };

    const redirectToFolder = (id) => {
        if (!id || id === rootFolder?.parent) {
            history.push(`/shared_with_me`)
            history.go(0)
        } else {
            history.push(`/shared_with_me?doc_id=${id}`)
            history.go(0)
        }
    }

    const downloadFile = async (record) => {
        const {cid, encrypted_password, name, file_type} = record
        if (encrypted_password) {
            download(cid, encrypted_password, name, file_type)
        } else if (rootFolder?.folder_password) {
            const {folder_password} = rootFolder
            download(cid, folder_password, name, file_type)
        } else {
            message.error('download error, invalid file')
        }
    }

    const previewFile = async (record) => {
        const {cid, encrypted_password, name, file_type} = record
        if (encrypted_password) {
            preview(cid, encrypted_password, name, file_type)
        } else if (rootFolder?.folder_password) {
            const {folder_password} = rootFolder
            preview(cid, folder_password, name, file_type)
        } else {
            message.error('download error, invalid file')
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
                            <a onClick={() => redirectToFolder(record.id)}>{!record.isTop && <FolderOpenOutlined />} {record.name}</a>:
                            <a onClick={() => previewFile(record)}><FileProtectOutlined /> {record.name}</a>
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
            title: '',
            render(text, record) {
                return (
                    <div>
                        {!record.isFolder && !record.isTop && <div className="d-flex justify-content-evenly">
                            <Tooltip title="Download">
                                <Button
                                    onClick={async () => downloadFile(record)}
                                >
                                    <DownloadOutlined />
                                </Button>
                            </Tooltip>
                        </div>}
                    </div>
                )
            }
        },
    ];

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
                            </Dragger>,
                        </Modal>
                    </div>
                </div>}
                <div className="list-items mt-3">
                    <div>
                        <Tooltip title="Back">
                            <Button onClick={() => redirectToFolder(parentFolder)}><ArrowLeftOutlined /></Button>
                        </Tooltip>
                    </div>
                    <div className="mt-3">
                        <Table 
                            columns={columns} 
                            dataSource={folderCurrent} 
                            rowKey={(record) => record.id} 
                        />
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}
