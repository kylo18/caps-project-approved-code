import { configureStore } from "@reduxjs/toolkit";
import subjectReducer from "./subjectSlice";

const store = configureStore({
  reducer: {
    subject: subjectReducer,
  },
});

export default store;
