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
    Table, 
    Tabs,
    Tooltip,
    Button
} from 'antd';
import { 
    useSelector, 
    useDispatch 
} from 'react-redux';
import {getSharedFileInfo} from '../store/slice/sharedFileWithMe.slice'
import {getSharedFolderInfo, getSharedFolderById} from '../store/slice/sharedFolderWithMe.slice'
import {
    createKeyPair,
    createPubKeyString,
    rsaEncrypt,
    rsaDecrypt
} from '../utils/rsa.utils'
import {
    storeFiles, 
    retrieveFiles,
    checkFileStatus,
    validateToken
} from '../utils/web3.storage'
import {wrap} from 'comlink'
import {concatenateBlobs, saveFile} from '../utils/file.utils'

export default function Shared() {
    
    const dispatch = useDispatch()
    const {current: filesSharedWithMe, loading: filesSharedWithMeLoading} = useSelector(state => state.sharedFileWithMe)
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)
    useEffect(() => {
        dispatch(getSharedFileInfo());
    }, [])

    const downloadSharedFile = async (record) => {
        const MattsRSAkey = createKeyPair(userCurrent.privateKey);
        const {plaintext, status} = rsaDecrypt(record.sharedPassword, MattsRSAkey)
        if (status === "success") {
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

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            render(text, record) {
                return (
                    <div>
                        {record.type !== 'File'  ? 
                            <a onClick={() => dispatch(getSharedFolderById(record.id))}>{record.name}</a>:
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
            title: 'Owner',
            dataIndex: 'owner',
        },
        {
            title: '',
            render(text, record) {
                return (
                    <div>
                        <div className="d-flex justify-content-evenly">
                            <Tooltip title="Download">
                                <Button onClick={() => downloadSharedFile(record)} >
                                    <DownloadOutlined />
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                )
            }
        },
    ];

    return (
        <>
        <div>
            <div className="header">
                <h2 className="title">Files shared with me</h2>
                <hr />
            </div>
            <div className="content">
                <div className="list-items mt-3">
                    <div className="mt-3">
                        <Table 
                            columns={columns} 
                            dataSource={filesSharedWithMe} 
                            rowKey={(record) => record.id}  
                        />
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}
