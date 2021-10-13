import React from 'react';
import { Route, Redirect } from "react-router-dom";

const GuardedRoute = (props) => {
    const {beforeRouteEnter, component: Component, ...rest} = props
    if (beforeRouteEnter) {
        return (
            <Route {...rest} >
                {!beforeRouteEnter() ? <Redirect to="/login" /> : <Component />}
            </Route>
        ) 
    } else {
        return (
            <Route {...rest} >
                <Component />
            </Route>
        ) 
    }
    
}

export default GuardedRoute;