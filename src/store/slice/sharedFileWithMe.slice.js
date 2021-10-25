import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';

export const getSharedFileInfo = createAsyncThunk(
    'filesSharedToMe/getSharedFileInfo',
    async (id, thunkApi) => {
        const {accountId} = await window.walletConnection.account();
        const res = await window.contract.get_shared_file_docs_by_owner({_account_id: accountId})
        const result = res.map(file => {
            return {
                ...file[3],
                owner: file[0],
                id: file[1],
                sharedPassword: file[2]
            }
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