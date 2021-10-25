import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';

export const getSharedFolderInfo = createAsyncThunk(
    'commonFolder/getSharedFolderInfo',
    async (id, thunkApi) => {
        const res = await window.contract.get_shared_folder_info({folder_id: id})
        const {children, files} = res
        const {accountId} = await window.walletConnection.account()
        const root = await window.contract.get_root_shared_folder({_current: id, _account_id: accountId})
        const childrenInDetail = await Promise.all(children.map(child => {
            return window.contract.get_shared_folder_info({folder_id: child}).then(result => {
                return {...result, id: child}
            })
        }))
        const filesDetail = await Promise.all(files.map(id => {
            return window.contract.get_file_info({file_id: id}).then(result => {
                return {...result, id}
            })
        }))
        if (root) {
            return {...res, id, children: childrenInDetail, root: root[1], rootId: root[0], files: filesDetail}
        } else {
            return {...res, id, children: childrenInDetail, files: filesDetail, root: null}
        }
    }
)


const sharedFolderSlice = createSlice({
    name: 'sharedFolder',
    initialState: {
        loading: false,
        current: {
            id: '',
            name: '',
            files: [],
            parent: '',
            children: [],
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
        }
    },
    reducers: {},
    extraReducers: {
        [getSharedFolderInfo.pending]: (state) => {
            state.loading = true;
        },
        [getSharedFolderInfo.fulfilled]: (state, {type, payload}) => {
            state.loading = false;
            if (payload) {
                state.current = payload
            } else {
                console.log('common folder is null')
            }
        },
        [getSharedFolderInfo.rejected]: (state, action) => {
            state.loading = false;
            state.error = action.error
        },
    },
})

const {actions, reducer} = sharedFolderSlice

export const { 
    
} = actions

export default reducer