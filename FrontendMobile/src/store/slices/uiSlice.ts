import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Subject } from '../../types';

interface UIState {
  isLoading: boolean;
  isSidebarExpanded: boolean;
  isMobile: boolean;
  selectedSubject: Subject | null;
  showPrintModal: boolean;
  showSubjectModal: boolean;
}

const initialState: UIState = {
  isLoading: false,
  isSidebarExpanded: true,
  isMobile: false,
  selectedSubject: null,
  showPrintModal: false,
  showSubjectModal: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSidebarExpanded: (state, action: PayloadAction<boolean>) => {
      state.isSidebarExpanded = action.payload;
    },
    setMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
    },
    setSelectedSubject: (state, action: PayloadAction<Subject | null>) => {
      state.selectedSubject = action.payload;
    },
    setShowPrintModal: (state, action: PayloadAction<boolean>) => {
      state.showPrintModal = action.payload;
    },
    setShowSubjectModal: (state, action: PayloadAction<boolean>) => {
      state.showSubjectModal = action.payload;
    },
  },
});

export const {
  setLoading,
  setSidebarExpanded,
  setMobile,
  setSelectedSubject,
  setShowPrintModal,
  setShowSubjectModal,
} = uiSlice.actions;
export default uiSlice.reducer;