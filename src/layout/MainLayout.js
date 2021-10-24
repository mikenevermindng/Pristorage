import React, {useState, useEffect} from 'react'
import './layout.css'
import { Layout, Menu, Input, Modal, Button, message } from 'antd';
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    DatabaseOutlined,
    UsergroupAddOutlined,
    UserSwitchOutlined
} from '@ant-design/icons';
const { Header, Sider, Content } = Layout;
import {useFormik } from 'formik';
import * as Yup from 'yup';
import {
    validateToken
} from '../utils/web3.storage'
import { 
    useHistory,
    Link
} from "react-router-dom";
import {
    createKeyPair,
    createPubKeyString,
    rsaEncrypt,
    rsaDecrypt
} from '../utils/rsa.utils'
import {entropyToMnemonic} from 'bip39'
import crypto from 'crypto'
import {saveFile} from '../utils/file.utils'
import {fetchUserInfo} from '../store/slice/user.slice'
import { unwrapResult } from '@reduxjs/toolkit'
import { useSelector, useDispatch } from 'react-redux';


const { TextArea } = Input;

const signupValidationSchema = Yup.object().shape({
    token: Yup.string().test('Xác minh cụm từ khôi phục', 'Mật khẩu không hợp lệ', value => {
        return new Promise((resolve, reject) => {
            validateToken(value).then(result => {
                console.log(result);
                resolve(result)
            })
        });
        
    }).required('Web3 storage token không được bổ trống')
});

const loginValidationSchema = Yup.object().shape({
    seedPhrase: Yup.string().test('Kiểm tra mật khẩu', 'Token không hợp lệ', value => {
        return value.split(" ").length === 12
        
    }).required('Web3 storage token không được bổ trống')
});

export default function MainLayout({children}) {

    let history = useHistory();
    const dispatch = useDispatch()

    const [collapsed, setCollapsed] = useState(false)
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isModalLoginVisible, setIsModalLoginVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const {current} = useSelector(state => state.user)

    const formik = useFormik({
        initialValues: {
            token: '',
        },
        validationSchema: signupValidationSchema,
        onSubmit: async () => {
            const {accountId} = await window.walletConnection.account()
            setLoading(true);
            const randomBytes = crypto.randomBytes(16)
            const mnemonic = entropyToMnemonic(randomBytes.toString('hex'))
            const blob = new Blob([mnemonic], { type: "text/plain;charset=utf-8" });
            saveFile(blob, `${accountId}_SeedPhrase.txt`)
            const MattsRSAkey = createKeyPair(mnemonic);
            const MattsPublicKeyString = createPubKeyString(MattsRSAkey)
            const encryptedToken = rsaEncrypt(values.token, MattsPublicKeyString)
            const {cipher, status} = encryptedToken
            if (status === "success") {
                window.localStorage.setItem(`${accountId}_private_key`, mnemonic)
                window.localStorage.setItem(`${accountId}_web3_storage_token`, values.token)
                await window.contract.sign_up({public_key: MattsPublicKeyString, encrypted_token: cipher})
                setIsModalVisible(false)
            }
        }
    })

    const loginFormik = useFormik({
        initialValues: {
            seedPhrase: '',
        },
        validationSchema: loginValidationSchema,
        onSubmit: async (values) => {
            window.localStorage.setItem(`${accountId}_private_key`, values.seedPhrase)
            history.go(0)
        }
    })

    const {values, errors, handleChange, handleSubmit, setFieldValue} = formik
    const {
        values: loginValues, 
        errors: loginErrors, 
        handleChange: loginHandleChange, 
        handleSubmit: loginHandleSubmit, 
        setFieldValue: loginSetFieldValue,
    } = loginFormik

    const toggle = () => {
        setCollapsed(!collapsed)
    }

    const showModal = () => {
        setIsModalVisible(true);
    };
    
    const handleOk = () => {
        handleSubmit()
    };
    
    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const showLoginModal = () => {
        setIsModalLoginVisible(true);
    };

    const handleLoginOk = () => {

    }



    useEffect(() => {
        const checkBeforeEnter = async () => {
            const account = await window.walletConnection.account()
            const account_id = account.accountId
            const user = await window.contract.get_user({account_id})
            if (!user) {
                showModal()
            } else {
                const private_key = window.localStorage.getItem(`${account_id}_private_key`)
                if (!private_key) {
                    setIsModalLoginVisible(true)
                } else {
                    const response = await dispatch(fetchUserInfo(private_key))
                    const user = unwrapResult(response)
                    if (!user.success) {
                        message.error("Mật khẩu không đúng")
                        showLoginModal()
                    }
                }
            }
        }
        checkBeforeEnter()
    }, [])

    return (
        <div id="page-layout-trigger">
            <Layout>
                <Sider trigger={null} collapsible collapsed={collapsed}>
                    <div className="logo"></div>
                    <Menu theme="dark" mode="inline">
                        <Menu.Item key="1" icon={<DatabaseOutlined />}>
                            <Link to="/">Lưu trữ cá nhân</Link>
                        </Menu.Item>
                        <Menu.Item key="2" icon={<UsergroupAddOutlined />}>
                            <Link to="/shared">Thư mục chia sẻ</Link>
                        </Menu.Item>
                        <Menu.Item key="3" icon={<UserSwitchOutlined />}>
                            <Link to="/shared_to_me">Được chia sẻ với tôi</Link>
                        </Menu.Item>
                    </Menu>
                </Sider>
                <Layout className="site-layout">
                    <Header className="site-layout-background" style={{ padding: 0 }}>
                        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                            className: 'trigger',
                            onClick: toggle,
                        })}
                    </Header>
                    <Content
                        className="site-layout-background"
                        style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        }}
                    >
                        {children}
                    </Content>
                </Layout>
            </Layout>
            <Modal
                visible={isModalLoginVisible}
                title="Vui lòng nhập cụm từ khôi phục"
                onOk={loginHandleSubmit}
                footer={[
                    <Button
                        loading={loading}
                        type="primary"
                        onClick={loginHandleSubmit}
                        key="signup button"
                    >
                        Đăng nhập
                    </Button>,
                ]}
            >
                <div className="input-group mb-3">
                    <label className="form-label">Mật khẩu</label>
                    <TextArea 
                        placeholder="Mật khẩu" 
                        onChange={loginHandleChange('seedPhrase')}
                    />
                    {loginErrors.seedPhrase && <span className="error-text">{loginErrors.seedPhrase}</span>}
                </div>
            </Modal>
            <Modal
                visible={isModalVisible}
                title="Bạn cần nhập Web3 Storage và Mật khẩu để xử dụng ứng dụng"
                onOk={handleOk}
                footer={[
                    <Button
                        loading={loading}
                        type="primary"
                        onClick={handleOk}
                        key="signup button"
                    >
                        Đăng ký
                    </Button>,
                ]}
            >
                <div className="input-group mb-3">
                    <label className="form-label">Web3Storage Token</label>
                    <TextArea 
                        placeholder="Web3Storage Token" 
                        onChange={handleChange('token')}
                    />
                    {errors.token && <span className="error-text">{errors.token}</span>}
                </div>
            </Modal>
        </div>
    )
}
