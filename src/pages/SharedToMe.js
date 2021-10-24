import React, {useState, useEffect} from 'react'
import './style/General.page.css'
import {
    FolderAddOutlined,
    UploadOutlined,
    InboxOutlined,
    DownloadOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { 
    Table, 
    Tabs
} from 'antd';
import { 
    useSelector, 
    useDispatch 
} from 'react-redux';
import {getSharedFileInfo} from '../store/slice/sharedFileWithMe.slice'
import {getSharedFolderInfo} from '../store/slice/sharedFolderWithMe.slice'

const { TabPane } = Tabs;

const columns = [
    {
        title: 'Tài khoản',
        dataIndex: 'account',
    },
    {
        title: 'Số lượng đã chia sẻ',
        render(text, record) {
            return <span>{record?.docs?.length}</span>
        }
    },
]

export default function Shared() {
    
    const dispatch = useDispatch()
    const {current: filesSharedToMe, loading: filesSharedToMeLoading} = useSelector(state => state.sharedFileWithMe)
    const {current: foldersSharedToMe, loading: foldersSharedToMeLoading} = useSelector(state => state.sharedFolderWithMe)

    useEffect(() => {
        dispatch(getSharedFileInfo());
        dispatch(getSharedFolderInfo());
    }, [])

    return (
        <>
        <div id="homepage">
            <div className="header">
                <h2 className="title">Được chia sẻ với tôi</h2>
                <hr />
            </div>
            <div className="content">
                <div className="list-items mt-3">
                    <Tabs tabPosition="left">
                        <TabPane tab="Thư mục" key="1">
                            <div className="header">
                                <h6 className="title">Thư mục được chia sẻ với tôi</h6>
                                <hr />
                            </div>
                            <div className="mt-3">
                                <Table 
                                    columns={columns} 
                                    dataSource={foldersSharedToMe ? foldersSharedToMe : []} 
                                    rowKey={(record) => record.id}  
                                />
                            </div>
                        </TabPane>
                        <TabPane tab="File" key="2">
                            <div className="header">
                                <h6 className="title">File được chia sẻ với tôi</h6>
                                <hr />
                            </div>
                            <div className="mt-3">
                                <Table 
                                    columns={columns} 
                                    dataSource={filesSharedToMe ? filesSharedToMe : []} 
                                    rowKey={(record) => record.id}  
                                />
                            </div>
                        </TabPane>
                    </Tabs>
                </div>
            </div>
        </div>
        </>
    )
}
