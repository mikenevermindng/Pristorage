import commonFolder from './commonFolder.slice'
import sharedFoler from './sharedFolder.slice'
import user from './user.slice'
import sharedFileWithMe from './sharedFileWithMe.slice'
import sharedFolderWithMe from './sharedFolderWithMe.slice'

const reducers = {
    commonFolder: commonFolder,
    sharedFolder: sharedFoler,
    user: user,
    sharedFileWithMe: sharedFileWithMe,
    sharedFolderWithMe: sharedFolderWithMe
}

export default reducers