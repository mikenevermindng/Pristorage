import React, {useState, useEffect} from 'react'
import './style/General.page.css'
import {
    FolderAddOutlined,
    UploadOutlined,
    InboxOutlined,
    DownloadOutlined,
    FolderOpenOutlined,
    FileProtectOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { 
    Button, 
    Table, 
    Modal, 
    Input, 
    Upload, 
    message, 
    Tooltip,
    Select 
} from 'antd';
import { 
    useSelector, 
} from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import {useFormik } from 'formik';
import * as Yup from 'yup';
import {
    encryptStringTypeData,
} from '../utils/keypair.utils'
import { useHistory } from 'react-router-dom';
import ShareFileButton from '../components/ShareFileButton'
import ShareFolderButton from '../components/ShareFolderButton'
import DeleteButton from '../components/DeleteButton'
import useFetchFolder from '../hook/useFetchFolder'
import useFileCreate from '../hook/useFileCreate'
import useDownloadFile from '../hook/useDownloadFile'
import useFilePreview from '../hook/useFilePreview'

const { Dragger } = Upload;
const {Option} = Select

const folderValidationSchema = Yup.object().shape({
    name: Yup.string().required('Invalid name'),
    type: Yup.number().required('Invalid type'),
});

export default function Home() {

    const history = useHistory()
    const {
        loading: folderLoading, 
        current: folderCurrent, 
        root: rootFolder,
        folderId: currentFolderId,
        parentFolder
    } = useSelector(state => state.folderV2)
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)
    const {loading: submitting, fileSubmit} = useFileCreate()
    const {loading: downloading, download} = useDownloadFile()
    useFetchFolder()
    const {
        preview
    } = useFilePreview()

    const formik = useFormik({
        initialValues: {
            name: '',
            type: null
        },
        validationSchema: folderValidationSchema,
        onSubmit: async (values) => {
            const currentTimeStamp = new Date().getTime()
            const id = uuidv4()
            const folder_password = uuidv4()
            const {success, cipher} = await encryptStringTypeData(userCurrent.publicKey, folder_password)
            if (success) {
                const folder = {
                    _id: id, 
                    _name: values.name, 
                    _parent: currentFolderId,
                    _created_at: currentTimeStamp,
                    _type: parseInt(values.type),
                    _password: cipher,
                }
                await window.contract.create_folder_v2(folder)
                history.go(0)
            }
            else {
                message.error("Invalid private key")
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
        },
    };

    const redirectToFolder = (id) => {
        history.push(`/v2?folder=${id}`)
        history.go(0)
    }

    const downloadFile = async (record) => {
        const {folder_type: folderType, folder_password} = rootFolder
        const {cid, encrypted_password, name, file_type} = record
        if (folderType === 1) {
            download(cid, encrypted_password, name, file_type)
        } else if (folderType === 2) {
            download(cid, folder_password, name, file_type)
        } else {
            message.error('download error, invalid file')
        }
    }

    const previewFile = async (record) => {
        const {folder_type: folderType, folder_password} = rootFolder
        const {cid, encrypted_password, name, file_type} = record
        if (folderType === 1) {
            preview(cid, encrypted_password, name, file_type)
        } else if (folderType === 2) {
            preview(cid, folder_password, name, file_type)
        } else {
            message.error('preview error, invalid file')
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
                            <a onClick={() => redirectToFolder(record.id)}>{!record.isTop && <FolderOpenOutlined />} {record.name}</a>
                            :
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

                            {rootFolder.folder_type === 1 &&<Tooltip title="Share file">
                                <ShareFileButton {...{...record, folder: currentFolderId}} />
                            </Tooltip>}

                            <Tooltip title="Remove">
                                <DeleteButton 
                                    type="File" 
                                    name={record.name} 
                                    handleDelete={async () => {
                                        await window.contract.remove_file_v2({_folder: currentFolderId, _file: record.id})
                                        history.go(0)
                                    }}
                                />
                            </Tooltip>
                        </div>}
                        {record.isFolder && !record.isTop && <div className="d-flex justify-content-evenly">
                            {record.parent === userCurrent.account && record.folder_type === 2 &&<Tooltip title="Share file">
                                <ShareFolderButton {...{...record, folder: currentFolderId}} />
                            </Tooltip>}

                            <Tooltip title="Remove">
                                <DeleteButton 
                                    type="Folder" 
                                    name={record.name} 
                                    handleDelete={async () => {
                                        await window.contract.remove_folder_v2({_folder: record.id})
                                        history.go(0)
                                    }}
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
                            loading={folderLoading} 
                        >
                            Create folder
                        </Button>
                        <Modal 
                            title="Create folder" 
                            visible={isModalCreateFolderVisible} 
                            onOk={handleSubmit} 
                            onCancel={handleCancelCreateFolder}
                        >
                            <div>
                                <label className="form-label">Folder name</label>
                                <div className="input-group mb-3">
                                    <Input placeholder="Folder name" onChange={handleChange('name')} />
                                </div>
                                {errors.name && <span className="error-text">{errors.name}</span>}
                            </div>
                            <div>
                                <label className="form-label">Folder type</label>
                                <Select style={{ width: '100%' }} onChange={(val) => setFieldValue('type', parseInt(val))}>
                                    <Option value="1">Private</Option>
                                    <Option value="2">Shareable</Option>
                                </Select>
                                {errors.type && <span className="error-text">{errors.type}</span>}
                            </div>
                        </Modal>
                    </div>
                    {currentFolderId !== userCurrent.account && <div className="action-button">
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
                    </div>}
                </div>
                <div>
                    <Tooltip title="Back">
                        <Button onClick={() => redirectToFolder(parentFolder)}><ArrowLeftOutlined /></Button>
                    </Tooltip>
                </div>
                <div className="list-items mt-3">
                    <Table 
                        columns={columns} 
                        dataSource={folderCurrent} 
                        rowKey={(record) => record.id} 
                    />
                </div>
            </div>
        </div>
        </>
    )
}
