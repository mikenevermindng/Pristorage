import React, {useState, useEffect} from 'react'
import { useHistory } from "react-router-dom";
import './style/LoginPage.module.css'
// import wave from './wave.png'
// import avatar from './avatar.svg'
// import doc from './doc.svg'
import {login} from '../utils/near.utils'

export default function LoginPage() {

    let history = useHistory();

    useEffect(() => {
        if (window.walletConnection.isSignedIn()) {
            setTimeout(() => {
                history.push("/home");
            }, 1000)
        }
    }, [])

    const submitHandler = (e) => {
        e.preventDefault()
        login()
    }

    if (!window.walletConnection.isSignedIn()) {
        return (
            <>
                <div className="login-screen">
                    <img className="login-wave" src="/wave.png" alt="" />
                    <div className="login-container">
                        <div className="login-img">
                            <img src="/doc.svg" alt="" />
                        </div>
                        <div className="login-content">
                            <form onSubmit={submitHandler}>
                                <img src="/avatar.svg" alt="" />
                                <h2 className="title">PriStorage</h2>
                                <input
                                    className="btn"
                                    type="submit"
                                    value=" Login with NEAR"
                                />
                            </form>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <div className="login-screen">
                <img className="login-wave" src="/wave.png" alt="" />
                <div className="login-container">
                    <div className="login-img">
                        <img src="/doc.svg" alt="" />
                    </div>
                    <div className="login-content">
                        <form onSubmit={submitHandler}>
                            <img src="/avatar.svg" alt="" />
                            <h2 className="title">Vi Storage</h2>
                            <h3>Bạn đã đăng nhập thành công</h3>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}
