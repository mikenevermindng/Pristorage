import { set } from 'lodash';
import React, {useEffect, useState} from 'react';
import { useHistory } from 'react-router-dom'
import {
    decryptStringTypeData
} from '../utils/keypair.utils'
import {setUser} from '../store/slice/user.slice'
import {useDispatch} from 'react-redux'

const useFetchUser = () => {

    const [isRegistered, setRegistered] = useState(true)
    const [isLoggedIn, setLoggedIn] = useState(true)
    const dispatch = useDispatch()

    const fetchUserInfo = async () => {
        const account = await window.walletConnection.account()
        const {accountId} = account
        const user = await window.contract.get_user({account_id: accountId})
        const privateKey = window.localStorage.getItem(`${accountId}_private_key`)
        if (!user) {
            setRegistered(false)
            return
        } 
        if (!privateKey) {
            setLoggedIn(false)
            return
        }
        const {public_key, encrypted_token} = user
        const {success, plaintext} = await decryptStringTypeData(privateKey, encrypted_token)
        if (!success) {
            setLoggedIn(false)
            return
        }
        const userDecoded = {
            publicKey: public_key,
            web3token: plaintext, 
            account: accountId,
            privateKey: privateKey,
        }
        dispatch(setUser(userDecoded))
    }

    useEffect(() => {
        fetchUserInfo()
    }, []) 

    return {
        isRegistered,
        isLoggedIn
    }
}

export default useFetchUser