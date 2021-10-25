import LoginPage from "../pages/Login"
import Home from '../pages/Home'
import Shared from '../pages/Shared'
import FileSharedWithMe from '../pages/FileSharedWithMe'
import FolderSharedWithMe from '../pages/FolderSharedWithMe'

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
        path: '/shared_file_to_me',
        component: FileSharedWithMe,
        beforeRouteEnter: isAuthenticated
    },
    {
        path: '/shared_folder_to_me',
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