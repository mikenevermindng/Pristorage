import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';

const commonFolderSlice = createSlice({
    name: 'folderV2',
    initialState: {
        loading: false,
        current: [],
        root: {},
        folderId: "",
        parentFolder: ""
    },
    reducers: {
        setCurrent: (state, {type, payload}) => {
            state.current = payload
        },
        setRoot: (state, {type, payload}) => {
            state.root = payload
        },
        setFolderId: (state, {type, payload}) => {
            state.folderId = payload
        },
        setParentFolder: (state, {type, payload}) => {
            state.parentFolder = payload
        },
    },
    extraReducers: {
        
    },
})

const {actions, reducer} = commonFolderSlice

export const { 
    setCurrent,
    setRoot,
    setFolderId,
    setParentFolder
} = actions

export default reducer