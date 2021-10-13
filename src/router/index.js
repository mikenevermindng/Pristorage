import HomePage from "../pages/HomePage"
import LoginPage from "../pages/LoginPage"

const isAuthenticated = () => {
    return window.walletConnection.isSignedIn()
}

const routers = [
    {
        path: '/login',
        component: LoginPage
    },
    {
        path: '/',
        component: HomePage,
        beforeRouteEnter: isAuthenticated
    },
]

module.exports = routers