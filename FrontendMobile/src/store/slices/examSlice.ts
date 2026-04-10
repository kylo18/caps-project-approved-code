import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ExamState {
  currentExam: any | null;
  examQuestions: any[];
  examStartTime: number | null;
  examState: 'idle' | 'in-progress' | 'completed';
  answers: Record<string, any>;
  bookmarks: number[];
  currentQuestionIndex: number;
}

const initialState: ExamState = {
  currentExam: null,
  examQuestions: [],
  examStartTime: null,
  examState: 'idle',
  answers: {},
  bookmarks: [],
  currentQuestionIndex: 0,
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    setExam: (state, action: PayloadAction<any>) => {
      state.currentExam = action.payload;
      state.examState = 'idle';
    },
    setExamQuestions: (state, action: PayloadAction<any[]>) => {
      state.examQuestions = action.payload;
    },
    startExam: (state) => {
      state.examState = 'in-progress';
      state.examStartTime = Date.now();
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.bookmarks = [];
    },
    submitExam: (state) => {
      state.examState = 'completed';
    },
    resetExam: (state) => {
      state.currentExam = null;
      state.examQuestions = [];
      state.examStartTime = null;
      state.examState = 'idle';
      state.answers = {};
      state.bookmarks = [];
      state.currentQuestionIndex = 0;
    },
    setAnswer: (state, action: PayloadAction<{ questionId: string; answer: any }>) => {
      state.answers[action.payload.questionId] = action.payload.answer;
    },
    toggleBookmark: (state, action: PayloadAction<number>) => {
      const idx = state.bookmarks.indexOf(action.payload);
      if (idx >= 0) {
        state.bookmarks.splice(idx, 1);
      } else {
        state.bookmarks.push(action.payload);
      }
    },
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload;
    },
  },
});

export const {
  setExam,
  setExamQuestions,
  startExam,
  submitExam,
  resetExam,
  setAnswer,
  toggleBookmark,
  setCurrentQuestionIndex,
} = examSlice.actions;
export default examSlice.reducer;
