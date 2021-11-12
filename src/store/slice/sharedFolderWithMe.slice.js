import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';

export const getSharedFoldersWithMeInfo = createAsyncThunk(
    'foldersSharedWithMe/getSharedFolderInfo',
    async (id, thunkApi) => {
        const {accountId} = await window.walletConnection.account();
        const res = await window.contract.get_shared_folder_docs_by_owner({_account_id: accountId})
        const result = res.map(folder => {
            return {
                ...folder[3],
                owner: folder[0],
                id: folder[1],
                sharedPassword: folder[2],
                permissions: folder[4],
                shareDocId: folder[5]
            }
        })
        return result
    }
)

export const getSharedFolderById = createAsyncThunk(
    'foldersSharedWithMe/getSharedFolderById',
    async ({id, owner}, thunkApi) => {
        const res = await window.contract.get_shared_folder_info({folder_id: id})
        console.log(res)
        const {children, files} = res
        const root = await window.contract.get_root_shared_folder({_current: id, _account_id: owner})
        const childrenInDetail = await Promise.all(children.map(child => {
            return window.contract.get_shared_folder_info({folder_id: child}).then(result => {
                return {...result, id: child, owner: owner}
            })
        }))
        const filesDetail = await Promise.all(files.map(id => {
            return window.contract.get_file_info({file_id: id}).then(result => {
                return {...result, id}
            })
        }))
        return {...res, id, children: childrenInDetail, root: root[1], rootId: root[0], files: filesDetail, owner}
    }
)

const sharedFolderInfoSlice = createSlice({
    name: 'foldersSharedWithMe',
    initialState: {
        loading: false,
        current: {
            id: '',
            name: '',
            files: [],
            parent: '',
            children: [],
            root: '',
            folder_password: '',
            root: {
                id: '',
                name: '',
                files: [],
                parent: '',
                children: [],
                root: '',
                folder_password: '',
            }
        },
        root: []
    },
    reducers: {},
    extraReducers: {
        [getSharedFoldersWithMeInfo.pending]: (state) => {
            state.loading = true;
        },
        [getSharedFoldersWithMeInfo.fulfilled]: (state, {type, payload}) => {
            state.loading = false;
            if (payload) {
                state.root = payload
                state.current = {
                    name: '',
                    files: [],
                    children: payload,
                    folder_password: '',
                    root: null
                }
            } else {
                console.log('shared folder is null')
            }
        },
        [getSharedFoldersWithMeInfo.rejected]: (state, action) => {
            state.loading = false;
            state.error = action.error
        },

        [getSharedFolderById.pending]: (state) => {
            state.loading = true;
        },
        [getSharedFolderById.fulfilled]: (state, {type, payload}) => {
            state.loading = false;
            if (payload) {
                state.current = payload
            } else {
                console.log('shared folder is null')
            }
        },
        [getSharedFolderById.rejected]: (state, action) => {
            state.loading = false;
            state.error = action.error
        },
    },
})

const {actions, reducer} = sharedFolderInfoSlice

export const { 
    
} = actions

export default reducer