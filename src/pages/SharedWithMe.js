import React, {useState, useEffect} from 'react'
import './style/General.page.css'
import {
    DownloadOutlined,
    FolderOpenOutlined,
    FileProtectOutlined
} from '@ant-design/icons';
import { 
    Table, 
    Tabs,
    Tooltip,
    Button,
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
import {getUrlParameter} from '../utils/url.utils'
import {useHistory} from 'react-router-dom'
import {getSharedFileInfo} from '../store/slice/sharedFileWithMe.slice'

const { TabPane } = Tabs;

export default function Shared() {

    const history = useHistory()

    const [data, setData] = useState([])
    const dispatch = useDispatch()
    const {current: foldersSharedWithMe, loading: foldersSharedWithMeLoading, root: rootFoldersSharedToMe } = useSelector(state => state.sharedFolderWithMe)
    const {current: filesSharedWithMe, loading: filesSharedWithMeLoading} = useSelector(state => state.sharedFileWithMe)
    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)
    
    useEffect(() => {
        const fetchData = async () => {
            await dispatch(getSharedFoldersWithMeInfo());
            const folderId = getUrlParameter('folder')
            const owner = getUrlParameter('owner')
            console.log(folderId, owner)
            if (folderId && owner) {
                await dispatch(getSharedFolderById({id: folderId, owner: owner}))
            } else {
                console.log('calling function')
                await dispatch(getSharedFileInfo());
            }
        }
        fetchData()
    }, [])

    const redirectToFolder = (id, owner) => {
        if (id === owner) {
            console.log(id, owner)
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
            const MattsRSAkey = createKeyPair(userCurrent.privateKey);
            const {plaintext, status} = rsaDecrypt(sharedPassword, MattsRSAkey)
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
                message.error('Fail to decrypt folder password')
            }
        } else {
            message.error('Fail to decrypt folder password')
        }
    }

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

    return (
        <>
        <div>
            <div className="header">
                <h2 className="title">Shared with me</h2>
                <hr />
            </div>
            <div className="content">
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
