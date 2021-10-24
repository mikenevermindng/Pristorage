import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';

export const getSharedFileInfo = createAsyncThunk(
    'filesSharedToMe/getSharedFileInfo',
    async (id, thunkApi) => {
        const {accountId} = await window.walletConnection.account();
        const res = await window.contract.get_shared_files_of_user({_account_id: accountId})
        var result = Object.keys(res).map((key) => {
            return {
                account: key, 
                docs: res[key]
            };
        })
        return result
    }
)

const sharedFileInfoSlice = createSlice({
    name: 'filesSharedToMe',
    initialState: {
        loading: false,
        current: []
    },
    reducers: {},
    extraReducers: {
        [getSharedFileInfo.pending]: (state) => {
            state.loading = true;
        },
        [getSharedFileInfo.fulfilled]: (state, {type, payload}) => {
            state.loading = false;
            if (payload) {
                state.current = payload
            } else {
                console.log('common folder is null')
            }
        },
        [getSharedFileInfo.rejected]: (state, action) => {
            state.loading = false;
            state.error = action.error
        },
    },
})

const {actions, reducer} = sharedFileInfoSlice

export const { 
    
} = actions

export default reducer