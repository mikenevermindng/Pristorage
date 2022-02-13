import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';

const commonFolderSlice = createSlice({
    name: 'folderV2',
    initialState: {
        loading: false,
        current: [],
        root: null,
        folderId: "",
        parentFolder: "",
        owner: "",
        permission: 1
    },
    reducers: {
        setCurrentSharedData: (state, {type, payload}) => {
            state.current = payload
        },
        setRootSharedFolder: (state, {type, payload}) => {
            state.root = payload
        },
        setSharedFolderId: (state, {type, payload}) => {
            state.folderId = payload
        },
        setParentOfSharedFolder: (state, {type, payload}) => {
            state.parentFolder = payload
        },
        setOwner: (state, {type, payload}) => {
            state.owner = payload
        },
        setPermission: (state, {type, payload}) => {
            state.permission = payload
        },
    },
    extraReducers: {
        
    },
})

const {actions, reducer} = commonFolderSlice

export const { 
    setCurrentSharedData,
    setRootSharedFolder,
    setSharedFolderId,
    setParentOfSharedFolder,
    setOwner,
    setPermission
} = actions

export default reducer