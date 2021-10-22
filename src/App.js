import 'regenerator-runtime/runtime'
import React, {useState} from 'react'
import {
    BrowserRouter as Router,
    Switch,
    Link
} from "react-router-dom";
import './global.css'
import GuardedRoute from './components/GuardedRoute';
import routers from './router/'
import 'antd/dist/antd.css';
import MainLayout from './layout/MainLayout'
import {Provider} from 'react-redux';
import store from './store/store'

export default function App() {
    return (
        <>
        <Provider store={store}>
            <Router>
                <MainLayout>
                    <Switch>
                        {routers.map((route, i) => {
                            return (
                                <GuardedRoute key={i} {...route} />
                            )
                        })}
                    </Switch>
                </MainLayout>
            </Router>
        </Provider>
        </>
    )
}