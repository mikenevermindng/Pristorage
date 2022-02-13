import user from './user.slice'
import folderV2 from './folderV2.slice'
import sharedWithMe from './sharedWithMeV2'

const reducers = {
    folderV2: folderV2,
    sharedWithMe: sharedWithMe,
    user: user,
}

export default reducers