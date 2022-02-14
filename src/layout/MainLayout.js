import React, {useState, useEffect} from 'react'
import './layout.css'
import { Layout, Menu, Input, Modal, Button, message, Dropdown, Space } from 'antd';
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    DatabaseOutlined,
    UsergroupAddOutlined,
    UserSwitchOutlined,
    CaretDownOutlined
} from '@ant-design/icons';
const { Header, Sider, Content } = Layout;
import {useFormik } from 'formik';
import * as Yup from 'yup';
import {
    validateToken
} from '../utils/web3.storage'
import { 
    useHistory,
} from "react-router-dom";
import {
    createKeyPair,
    encryptStringTypeData
} from '../utils/keypair.utils'
import {saveFile} from '../utils/file.utils'
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash'
import useFetchUser from '../hook/useFetchUser'
import {logout} from '../utils/near.utils'


const { TextArea } = Input;

const signupValidationSchema = Yup.object().shape({
    token: Yup.string().test('Validate password', 'Invalid Token', value => {
        return new Promise((resolve, reject) => {
            validateToken(value).then(result => {
                resolve(result)
            })
        });
        
    }).required('Invalid Web3 storage token')
});

const loginValidationSchema = Yup.object().shape({
    seedPhrase: Yup.string().test('Validate password', 'Invalid password', value => {
        return value.length > 12
        
    }).required('Invalid Web3 storage token')
});

export default function MainLayout({children}) {

    let history = useHistory();
    const dispatch = useDispatch()

    const [collapsed, setCollapsed] = useState(false)
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isModalLoginVisible, setIsModalLoginVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isHideLayout, setHideLayout] = useState(false);
    const [modalKeyVisible, setModalKeyVisible] = useState(false);
    const {
        isRegistered,
        isLoggedIn
    } = useFetchUser()
    const [accountId, setAccountId] = useState("")

    useEffect(() => {
        const currentURL = window.location.href
        if (currentURL.includes('login')) {
            setHideLayout(true)
        } else {
            setHideLayout(false)
        }
    }, [])

    const {current} = useSelector(state => state.user)

    const formik = useFormik({
        initialValues: {
            token: '',
        },
        validationSchema: signupValidationSchema,
        onSubmit: async (values) => {
            const {accountId} = await window.walletConnection.account()
            setLoading(true);
            const {privateKey, publicKey} = createKeyPair();
            // const blob = new Blob([privateKey], { type: "text/plain;charset=utf-8" });
            // saveFile(blob, `${accountId}_private_key.txt`)
            const {success, cipher} = await encryptStringTypeData(publicKey, values.token)
            if (success) {
                window.localStorage.setItem(`${accountId}_private_key`, privateKey)
                window.localStorage.setItem(`${accountId}_web3_storage_token`, values.token)
                const current = new Date().getTime()
                await window.contract.sign_up({_public_key: publicKey, _encrypted_token: cipher, _created_at: current})
                setIsModalVisible(false)
                history.go(0)
            } else {
                message.error('Fail to sign up')
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

    const logoutHandler = async () => {
        const {accountId} = await window.walletConnection.account()
        window.localStorage.removeItem(`${accountId}_private_key`)
        window.localStorage.removeItem(`${accountId}_web3_storage_token`)
        logout().then(() => {
            history.push('/login')
        }) 
    }

    const downloadPrivateKey = () => {
        const {privateKey, account} = current
        const blob = new Blob([privateKey], { type: "text/plain;charset=utf-8" });
        saveFile(blob, `${account}_private_key.txt`)
    }

    const menu = (
        <Menu>
            <Menu.Item key="1" onClick={() => setModalKeyVisible(true)}>
                Private Key
            </Menu.Item>
            <Menu.Item key="2" onClick={logoutHandler} danger>
                Logout
            </Menu.Item>
        </Menu>
    );

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
    
    useEffect(() => {
        if (!current.success && current.status === 1) {
            showModal()
        }
    }, [current])


    const getAccountId = async () => {
        const {accountId} = await window.walletConnection.account()
        setAccountId(accountId)
    }

    useEffect(() => {
        getAccountId()
        if (!isRegistered) {
            showModal()
        } else if (!isLoggedIn) {
            setIsModalLoginVisible(true)
        }
    }, [isRegistered, isLoggedIn])

    const redirect = (path) => {
        history.push(path)
        history.go(0)
    }

    return (
        <div id="page-layout-trigger">
            {isHideLayout ? <div>{children}</div> : <Layout>
                <Sider trigger={null} collapsible collapsed={collapsed}>
                    <div className="logo"></div>
                    <Menu theme="dark" mode="inline">
                        <Menu.Item key="2" icon={<DatabaseOutlined />} onClick={() => redirect("/")}>
                            My Folders V2
                        </Menu.Item>
                        <Menu.Item key="4" icon={<UserSwitchOutlined />} onClick={() => redirect("/shared_with_me")}>
                            Shared With Me V2
                        </Menu.Item>
                    </Menu>
                </Sider>
                <Layout className="site-layout">
                    <Header className="site-layout-background" style={{ padding: 0 }}>
                        <div className="d-flex justify-content-between">
                            <div>
                                {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                                    className: 'trigger',
                                    onClick: toggle,
                                })}
                            </div>
                            <div className="account">
                                <Dropdown overlay={menu} placement="bottomLeft">
                                    <Button type="text">{current.account}<CaretDownOutlined /></Button>
                                </Dropdown>
                            </div>
                        </div>
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
            </Layout>}
            <Modal
                visible={isModalLoginVisible}
                title={`Login as ${accountId}`}
                onOk={loginHandleSubmit}
                footer={[
                    <Button
                        loading={loading}
                        onClick={logoutHandler}
                        key="signout button"
                    >
                        Login with another account
                    </Button>,
                    <Button
                        loading={loading}
                        type="primary"
                        onClick={loginHandleSubmit}
                        key="signup button"
                    >
                        Login
                    </Button>,
                ]}
            >
                <div className="input-group mb-3">
                    <label className="form-label">Please enter your private key</label>
                    <TextArea 
                        placeholder="Private key" 
                        onChange={loginHandleChange('seedPhrase')}
                    />
                    {loginErrors.seedPhrase && <span className="error-text">{loginErrors.seedPhrase}</span>}
                </div>
            </Modal>
            <Modal
                visible={isModalVisible}
                title="Web3 Storage token is required"
                onOk={handleOk}
                footer={[
                    <Button
                        loading={loading}
                        type="primary"
                        onClick={handleOk}
                        key="signup button"
                    >
                        Register
                    </Button>,
                ]}
            >
                <div className="input-group mb-3 d-block">
                    <div className="form-label"><b>Web3Storage Token</b></div>
                    <div>You can get or create your token at this <a href="https://web3.storage/account/" target="_blank">link</a></div>
                    <TextArea 
                        placeholder="Web3Storage Token" 
                        onChange={handleChange('token')}
                    />
                    {errors.token && <span className="error-text">{errors.token}</span>}
                </div>
            </Modal>
            <Modal
                visible={modalKeyVisible}
                title="User's private key"
                onOk={() => setModalKeyVisible(false)}
                onCancel={() => setModalKeyVisible(false)}
                footer={[
                    <Button type="primary" onClick={downloadPrivateKey}>Download</Button>
                ]}
            >
                <div className="input-group mb-3">
                    <label className="form-label">Private key</label>
                    <TextArea 
                        disabled
                        value={current.privateKey} 
                    />
                </div>
            </Modal>
        </div>
    )
}
