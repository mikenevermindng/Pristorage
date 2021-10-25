import React from 'react';
import { 
    Button, 
    Modal, 
} from 'antd'
import {
    DeleteOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons'
const { confirm } = Modal

const DeleteButton = (props) => {

    const {type, handleDelete, name} = props;

    const showConfirm = () => {
        confirm({
            title: `Do you Want to delete this ${type}?`,
            icon: <ExclamationCircleOutlined />,
            content: name,
            onOk() {
                handleDelete()
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