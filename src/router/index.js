import LoginPage from "../pages/Login"
import Home from '../pages/Home'
import Shared from '../pages/Shared'
import FileSharedWithMe from '../pages/FileSharedWithMe'
import FolderSharedWithMe from '../pages/SharedWithMe'

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
        path: '/shared_with_me',
        component: FolderSharedWithMe,
        beforeRouteEnter: isAuthenticated
    },
    {
        path: '/',
        component: Home,
        beforeRouteEnter: isAuthenticated
    },
]

module.exports = routers