import React, {useState, useEffect} from 'react'
import { useHistory } from "react-router-dom";
import './style/LoginPage.module.css'
import wave from '../assets/wave.png'
import avatar from '../assets/avatar.svg'
import doc from '../assets/doc.svg'
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
                    <img className="login-wave" src={wave} alt="" />
                    <div className="login-container">
                        <div className="login-img">
                            <img src={doc} alt="" />
                        </div>
                        <div className="login-content">
                            <form onSubmit={submitHandler}>
                                <img src={avatar} alt="" />
                                <h2 className="title">Vi Storage</h2>
                                <h4>Bạn cần tạo ví Near để đăng nhập</h4>
                                <input
                                    className="btn"
                                    type="submit"
                                    value=" Đăng nhập với NEAR"
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
                <img className="login-wave" src={wave} alt="" />
                <div className="login-container">
                    <div className="login-img">
                        <img src={doc} alt="" />
                    </div>
                    <div className="login-content">
                        <form onSubmit={submitHandler}>
                            <img src={avatar} alt="" />
                            <h2 className="title">Vi Storage</h2>
                            <h3>Bạn đã đăng nhập thành công</h3>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}
