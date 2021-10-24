import LoginPage from "../pages/Login"
import Home from '../pages/Home'
import Shared from '../pages/Shared'
import SharedToMe from '../pages/SharedToMe'

const isAuthenticated = () => {
    return window.walletConnection.isSignedIn()
}

const routers = [
    {
        path: '/login',
        component: LoginPage
    },
    {
        path: '/shared',
        component: Shared,
        beforeRouteEnter: isAuthenticated
    },
    {
        path: '/shared_to_me',
        component: SharedToMe,
        beforeRouteEnter: isAuthenticated
    },
    {
        path: '/',
        component: Home,
        beforeRouteEnter: isAuthenticated
    },
]

module.exports = routers