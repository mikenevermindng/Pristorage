import React, {useEffect, useState} from 'react';
import {
    decryptStringTypeData
} from '../utils/keypair.utils'
import {
    setRoot,
    setCurrent,
    setFolderId,
    setParentFolder
} from '../store/slice/folderV2.slice'
import {useDispatch} from 'react-redux'
import {getUrlParameter} from '../utils/url.utils'

const useFetchFolder = () => {

    const [folderItems, setFolderItems] = useState([])
    const [root, setRootFolder] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const dispatch = useDispatch()

    const fetchData = async () => {
        const {accountId} = await window.walletConnection.account()
        const folderId = getUrlParameter('folder') ? getUrlParameter('folder') : accountId
        dispatch(setFolderId(folderId))
        const folderData = await window.contract.get_folder_info_v2({folder_id: folderId})
        const [root, root_id] = await window.contract.get_root({folder_id: folderId})
        const {children, files} = folderData
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
        let dataMapping = [...childrenInDetail, ...filesDetail]
        setRootFolder(root)
        setFolderItems(dataMapping)
        setLoading(false)
        dispatch(setRoot(root))
        dispatch(setCurrent(dataMapping))
        dispatch(setParentFolder(folderData.parent))
    }

    useEffect(() => {
        setLoading(true)
        fetchData()
    }, []) 

    return {
        folderItems,
        root,
        loading,
        error
    }
}

export default useFetchFolder