import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {
    createKeyPair,
    createPubKeyString,
    rsaEncrypt,
    rsaDecrypt
} from '../../utils/rsa.utils'

export const fetchUserInfo = createAsyncThunk(
    'user/fetchUserInfo',
    async (seedPhrase, thunkApi) => {
        const account = await window.walletConnection.account()
        const walletConnection = window.walletConnection
        const {accountId} = account
        const user = await window.contract.get_user({account_id: accountId})
        const {public_key, encrypted_token} = user
        const MattsRSAkey = createKeyPair(seedPhrase);
        const {status, plaintext} = rsaDecrypt(encrypted_token, MattsRSAkey)
        if (status === "success") {
            return {
                success: true,
                publicKey: public_key, 
                web3token: plaintext, 
                account: accountId,
                privateKey: seedPhrase
            }
        } else {
            return {
                success: false,
            }
        }
    }
)

const userSlice = createSlice({
    name: 'user',
    initialState: {
        loading: false,
        current: {
            account: "",
            publicKey: "",
            token: ""
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
            if (payload.success) {
                state.current = payload
            } else {
                console.log('common folder is null')
            }
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