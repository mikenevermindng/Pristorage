import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './slice/root.slice'
//...

const store = configureStore({
    reducer: rootReducer
})

export default store