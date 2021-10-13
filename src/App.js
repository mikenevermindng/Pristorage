import 'regenerator-runtime/runtime'
import React from 'react'
import {
    BrowserRouter as Router,
    Switch,
    Link
  } from "react-router-dom";
import './global.css'
import GuardedRoute from './components/GuardedRoute';
import routers from './router/'
import 'antd/dist/antd.css';

export default function App() {

    return (
        <>
        <Router>
            <Switch>
                {routers.map((route, i) => {
                    return (
                        <GuardedRoute key={i} {...route} />
                    )
                })}
            </Switch>
        </Router>
        </>
    )
}