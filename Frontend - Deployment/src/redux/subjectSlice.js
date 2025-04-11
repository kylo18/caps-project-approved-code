import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Fetch subjects from backend
export const fetchSubjects = createAsyncThunk("subject/fetchSubjects", async () => {
  const response = await fetch("https://your-api.com/subjects"); // Replace with your API URL
  const data = await response.json();
  return data; // Assuming data is an array like ["Calculus 1", "Chemistry", "Physics"]
});

const subjectSlice = createSlice({
  name: "subject",
  initialState: {
    subjects: [],
    selectedSubject: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSubject: (state, action) => {
      state.selectedSubject = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = action.payload;
        if (action.payload.length > 0) {
          state.selectedSubject = action.payload[0]; // Set first subject as default
        }
      })
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setSubject } = subjectSlice.actions;
export default subjectSlice.reducer;
