import {createSlice} from '@reduxjs/toolkit';

const userSlice = createSlice({
    name: 'user',
    initialState: {
        loading: false,
        current: {
            account: "",
            privateKey: "",
            publicKey: "",
            web3token: ""
        }
    },
    reducers: {
        setUser: (state, {type, payload}) => {
            state.current = payload
        },

        logout(state) {
            state.current = {
                status: 0,
                account: "",
                publicKey: "",
                web3token: ""
            }
        }
    },

    extraReducers: {
        
    },
})

const {actions, reducer} = userSlice

export const { 
    setUser,
    logout
} = actions

export default reducer