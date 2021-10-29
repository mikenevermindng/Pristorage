import React from 'react';
import { 
    Button, 
    Modal, 
} from 'antd'
import {
    DeleteOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons'
import { useHistory } from 'react-router-dom'
const { confirm } = Modal

const DeleteButton = (props) => {

    const history = useHistory()
    const {type, handleDelete, name} = props;

    const showConfirm = () => {
        confirm({
            title: `Do you Want to delete this ${type}?`,
            icon: <ExclamationCircleOutlined />,
            content: name,
            onOk() {
                handleDelete().then(() => {
                    history.go(0)
                })
            },
            onCancel() {
            },
        });
    }

    return (
        <>
        <Button danger onClick={showConfirm}>
            <DeleteOutlined />
        </Button>
        </>
    )
}

export default DeleteButton