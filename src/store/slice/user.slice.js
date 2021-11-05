import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {
    decryptStringTypeData
} from '../../utils/keypair.utils'

export const fetchUserInfo = createAsyncThunk(
    'user/fetchUserInfo',
    async (privateKey, thunkApi) => {
        const account = await window.walletConnection.account()
        const {accountId} = account
        const user = await window.contract.get_user({account_id: accountId})
        console.log(user)
        if (!user) {
            return {
                success: false,
                status: 1
            }
        }
        const {public_key, encrypted_token} = user
        const {success, plaintext} = await decryptStringTypeData(privateKey, encrypted_token)
        if (success) {
            return {
                success: true,
                publicKey: public_key, 
                web3token: plaintext, 
                account: accountId,
                privateKey: privateKey,
                status: 0
            }
        } else {
            return {
                success: false,
                status: 1
            }
        }
    }
)

const userSlice = createSlice({
    name: 'user',
    initialState: {
        loading: false,
        current: {
            status: 0,
            account: "",
            publicKey: "",
            web3token: ""
        }
    },
    reducers: {
        getToken: function(state) {
            
        } 
    },
    extraReducers: {
        [fetchUserInfo.pending]: (state) => {
            state.loading = true;
        },
        [fetchUserInfo.fulfilled]: (state, {type, payload}) => {
            state.loading = false;
            state.current = payload
        },
        [fetchUserInfo.rejected]: (state, action) => {
            state.loading = false;
            state.error = action.error
        },
    },
})

const {actions, reducer} = userSlice

export const { 
    
} = actions

export default reducer