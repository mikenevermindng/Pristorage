import commonFolderSlice from './commonFolder.slice'
import sharedFolerSlice from './sharedFolder.slice'
import userSlice from './user.slice'

const reducers = {
    commonFolder: commonFolderSlice,
    sharedFolder: sharedFolerSlice,
    user: userSlice
}

export default reducers