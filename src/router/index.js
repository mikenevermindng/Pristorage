import LoginPage from "../pages/Login"
import FolderSharedWithMe from '../pages/SharedWithMe'
import HomeV2 from '../pages/HomeV2'

const isAuthenticated = () => {
    return window.walletConnection.isSignedIn()
}

const routers = [
    {
        path: '/login',
        component: LoginPage
    },
    {
        path: '/shared_with_me',
        component: FolderSharedWithMe,
        beforeRouteEnter: isAuthenticated
    },
    {
        path: '/',
        component: HomeV2,
        beforeRouteEnter: isAuthenticated
    },
]

module.exports = routers