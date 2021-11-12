import React, {useState, useEffect} from 'react';
import { 
    Button, 
    Modal, 
    Input,
    Select,
    message
} from 'antd'
import {
    ShareAltOutlined,
} from '@ant-design/icons';
import {
    getPublicKeyByPrivateKey,
    encryptStringTypeData,
    decryptStringTypeData
} from '../../utils/keypair.utils'

import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';

const validationSchema = Yup.object().shape({
    account: Yup.string().required('Invalid account id'),
    permissions: Yup.number().required('Invalid permission'),
});

const {Option} = Select

const ShareFileButton = (props) => {

    const dispatch = useDispatch()

    const {loading: loadingCurrent, current: userCurrent} = useSelector(state => state.user)

    const accountFormik = useFormik({
        initialValues: {
            account: '',
            permissions: ''
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            const user = await window.contract.get_user({account_id: values.account})
            if (!user) {
                message.error(`User "${values.account}" not found`)
                return
            }
            const {plaintext, success: decryptStatus} = await decryptStringTypeData(userCurrent.privateKey, props.encrypted_password)
            if (!decryptStatus) {
                message.error(`Wrong user password`)
                return
            }
            const {public_key} = user
            const {cipher, success} = await encryptStringTypeData(public_key, plaintext)
            if (!success) {
                message.error(`Fail to encrypt password`)
                return
            }
            const params = {
                _file_id: props.id, 
                _doc_id: `${userCurrent.account}_${values.account}_${props.id}`, 
                _share_with: values.account, 
                _parent_folder: props.folder, 
                _password: cipher,
                _permissions: values.permissions
            }
            const data = await window.contract.share_file(params)
            history.go(0)
        }
    })

    const {
        values: values, 
        errors: errors, 
        handleChange: handleChange, 
        handleSubmit: handleSubmit, 
        setFieldValue: setFieldValue
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
            title="Share file" 
            visible={isModalShareVisible} 
            onOk={handleSubmit} 
            onCancel={handleCancelShare}
        >
            <div className="input-group mb-3">
                <label className="form-label">Share with</label>
                <Input placeholder="Account id" onChange={handleChange('account')} />
            </div>
            {errors.account && <span className="error-text">{errors.account}</span>}
            
            <div className="input-group mb-3">
                <label className="form-label">Permission</label>
                <Select style={{ width: '100%' }} onChange={(val) => setFieldValue('permissions', parseInt(val))}>
                    <Option value="1">Chỉ đọc</Option>
                    <Option value="2">Thay đổi</Option>
                </Select>
            </div>
            {errors.permissions && <span className="error-text">{errors.permissions}</span>}
        </Modal>
        </>
    )
}

export default ShareFileButton;