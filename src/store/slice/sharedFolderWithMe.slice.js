import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';

export const getSharedFolderInfo = createAsyncThunk(
    'foldersSharedToMe/getSharedFolderInfo',
    async (id, thunkApi) => {
        const {accountId} = await window.walletConnection.account();
        const res = await window.contract.get_shared_folders_of_user({_account_id: accountId})
        var result = Object.keys(res).map((key) => {
            return {
                account: key, 
                docs: res[key]
            };
        })
        return result
    }
)

const sharedFolderInfoSlice = createSlice({
    name: 'filesSharedToMe',
    initialState: {
        loading: false,
        current: []
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
                console.log('shared folder is null')
            }
        },
        [getSharedFolderInfo.rejected]: (state, action) => {
            state.loading = false;
            state.error = action.error
        },
    },
})

const {actions, reducer} = sharedFolderInfoSlice

export const { 
    
} = actions

export default reducer