import React, {useEffect, useState} from 'react';
import {
    decryptStringTypeData
} from '../utils/keypair.utils'
import {
    setCurrentSharedData,
    setRootSharedFolder,
    setSharedFolderId,
    setParentOfSharedFolder,
    setPermission
} from '../store/slice/sharedWithMeV2'
import {useDispatch} from 'react-redux'
import {getUrlParameter} from '../utils/url.utils'

const useFetchSharedDocs = () => {

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [page, setPage] = useState(0)
    const [total, setTotal] = useState(0)
    const [limit, setLimit] = useState(10)

    const dispatch = useDispatch()

    const fetchSharedFolderDetail = async (folderId) => {
        const {accountId} = await window.walletConnection.account()
        dispatch(setSharedFolderId(folderId))
        const folder = await window.contract.get_folder_info_v2({folder_id: folderId})
        const [root, root_id] = await window.contract.get_root({folder_id: folderId})
        const sharedDocDetail = await window.contract.get_shared_doc_detail({_doc_id: `${root.created_by}_${accountId}_${root_id}`})
        const [sharedDoc, , file] = sharedDocDetail 
        const {children, files} = folder
        const childrenInDetail = await Promise.all(children.map(child => {
            return window.contract.get_folder_info_v2({folder_id: child}).then(result => {
                return {
                    ...result, 
                    id: child, 
                    isFolder: true,
                    numOfFolders: result.children.length,
                    numOfFiles: result.files.length,
                    file_type: 'folder',
                    children: undefined,
                    files: undefined
                };
            })
        }))
        const filesDetail = await Promise.all(files.map(id => {
            return window.contract.get_file_info({file_id: id}).then(result => {
                return {...result, id, isFolder: false}
            })
        }))
        let data = [...childrenInDetail, ...filesDetail]
        setLoading(false)
        dispatch(setRootSharedFolder({
            ...root,
            id: root_id,
            folder_password: sharedDoc.share_password,
            permissions: sharedDoc.permissions,
        }))
        dispatch(setCurrentSharedData(data))
        dispatch(setParentOfSharedFolder(folder.parent))
        dispatch(setPermission(sharedDoc.permissions))
    }

    const fetchSharedDoc = async () => {
        let data = []
        const {accountId} = await window.walletConnection.account()
        const sharedDocOfUser = await window.contract.get_shared_doc_of_user({_account_id: accountId})
        setTotal(sharedDocOfUser.length)
        // const start = page * limit
        // const end = (page + 1) * limit
        // const sharedDocSlice = sharedDocOfUser.slice(start, end)
        Promise.all(sharedDocOfUser.map(doc => {
            return window.contract.get_shared_doc_detail({_doc_id: doc})
        })).then((result) => {
            result.forEach(shareData => {
                const [sharedDoc, folder, file, docId] = shareData
                if (folder) {
                    data.push({
                        ...folder,
                        docId: docId,
                        id: sharedDoc.doc_id,
                        folder_password: sharedDoc.share_password,
                        permissions: sharedDoc.permissions,
                        file_type: "folder",
                        numOfFiles: folder.files.length,
                        numOfFolders: folder.children.length,
                        isFolder: true,
                        children: undefined,
                        files: undefined
                    })
                } else {
                    data.push({
                        ...file, 
                        docId: docId,
                        encrypted_password: sharedDoc.share_password,
                        permissions: sharedDoc.permissions,
                        isFolder: false,
                        id: sharedDoc.doc_id
                    })
                }
            })
            dispatch(setCurrentSharedData(data))
        })
    }

    useEffect(() => {
        setLoading(true)
        const folderId = getUrlParameter('doc_id')
        if  (folderId) {
            fetchSharedFolderDetail(folderId)
        } else {
            fetchSharedDoc()
        }
        
    }, [page, limit]) 

    return {
        loading,
        error,
        setPage,
        setLimit,
        total,
        page,
        limit
    }
}

export default useFetchSharedDocs