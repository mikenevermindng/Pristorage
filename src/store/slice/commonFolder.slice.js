import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';

export const getFolderInfo = createAsyncThunk(
    'commonFolder/getFolderInfo',
    async (id, thunkApi) => {
        const res = await window.contract.get_folder_info({folder_id: id})
        const {children, files} = res
        const childrenInDetail = await Promise.all(children.map(child => {
            return window.contract.get_folder_info({folder_id: child}).then(result => {
                return {...result, id: child}
            })
        }))
        const filesDetail = await Promise.all(files.map(id => {
            return window.contract.get_file_info({file_id: id}).then(result => {
                return {...result, id}
            })
        }))
        return {...res, id, children: childrenInDetail, files: filesDetail}
    }
)

export const createCommonFolder = createAsyncThunk(
    'commonFolder/createCommonFolder',
    async ({id, name, parent}, thunkApi) => {
        const res = await window.contract.create_folder({id, name, parent})
        return res
    }
)


const commonFolderSlice = createSlice({
    name: 'commonFolder',
    initialState: {
        loading: false,
        current: {
            id: '',
            name: '',
            files: [],
            parent: '',
            children: [],
            root: ''
        }
    },
    reducers: {},
    extraReducers: {
        [getFolderInfo.pending]: (state) => {
            state.loading = true;
        },
        [getFolderInfo.fulfilled]: (state, {type, payload}) => {
            state.loading = false;
            if (payload) {
                state.current = payload
            } else {
                console.log('common folder is null')
            }
        },
        [getFolderInfo.rejected]: (state, action) => {
            state.loading = false;
            state.error = action.error
        },

        [createCommonFolder.pending]: (state) => {
            state.loading = true;
        },
        [createCommonFolder.fulfilled]: (state, {type, payload}) => {
            state.loading = false;
        },
        [createCommonFolder.rejected]: (state, action) => {
            state.loading = false;
        }
    },
})

const {actions, reducer} = commonFolderSlice

export const { 
    
} = actions

export default reducer