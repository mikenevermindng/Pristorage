import React, {useState, useEffect} from 'react';
import { 
    Button, 
    Modal, 
    Input,
    message
} from 'antd'
import {
    ShareAltOutlined,
} from '@ant-design/icons';
import {
    createKeyPair,
    createPubKeyString,
    rsaEncrypt,
    rsaDecrypt
} from '../../utils/rsa.utils'

import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';

const accountValidationSchema = Yup.object().shape({
    account: Yup.string().required('Invalid account id'),
});

const ShareFolderButton = (props) => {

    const dispatch = useDispatch()

    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)

    const accountFormik = useFormik({
        initialValues: {
            account: '',
        },
        validationSchema: accountValidationSchema,
        onSubmit: async (values) => {
            console.log(props)
            const user = await window.contract.get_user({account_id: values.account})
            if (!user) {
                message.error(`User "${values.account}" not found`)
                return
            }
            const MattsRSAkey = createKeyPair(userCurrent.privateKey);
            const {plaintext, status: decryptStatus} = rsaDecrypt(props.folder_password, MattsRSAkey)
            if (decryptStatus !== "success") {
                message.error(`Wrong user password`)
                return
            }
            const {public_key} = user
            const {cipher, status} = rsaEncrypt(plaintext, public_key)
            if (status !== "success") {
                message.error(`fail to encrypt password`)
                return
            }
            const params = {
                _folder_id: props.id, 
                _doc_id: `${userCurrent.account}_${values.account}_${props.id}`, 
                _share_with: values.account, 
                _password: cipher
            }
            await window.contract.share_folder(params)
            history.go(0)
        }
    })

    const {
        values: accountValues, 
        errors: accountErrors, 
        handleChange: accountHandleChange, 
        handleSubmit: accountHandleSubmit, 
        setFieldValue: accountSetFieldValue
    } = accountFormik

    const [isModalShareVisible, setIsModalShareVisible] = useState(false);

    const showModalShare = () => {
        setIsModalShareVisible(true);
    };
    
    const handleCancelShare = () => {
        setIsModalShareVisible(false);
    };

    return (
        <>
        <Button onClick={showModalShare}>
            <ShareAltOutlined />
        </Button>
        <Modal 
            title="Share folder" 
            visible={isModalShareVisible} 
            onOk={accountHandleSubmit} 
            onCancel={handleCancelShare}
        >
            <label className="form-label">Share with</label>
            <div className="input-group mb-3">
                <Input placeholder="Account id" onChange={accountHandleChange('account')} />
            </div>
            {accountErrors.account && <span className="error-text">{accountErrors.account}</span>}
        </Modal>
        </>
    )
}

export default ShareFolderButton;