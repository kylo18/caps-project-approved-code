import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/layout";
import ProtectedRoute from "./components/protectRoute"; // Import ProtectedRoute

import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import ProgramChairDashboard from "./pages/ProgramChairDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import ScrollToTop from "./components/scrollToTop";
import Users from "./pages/Users";

import AdminContent from "./pages/AdminContent";
import ProgramChairContent from "./pages/ProgramChairContent";
import FacultyContent from "./pages/FacultyContent";
import PracticeTestResult from "./pages/PracticeTestResult";
import PracticeExam from "./pages/PracticeExam";

import PrintExam from "./pages/PrintExam";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/practice-exam-result"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<PracticeTestResult />} />
          <Route path="content" element={<PracticeTestResult />} />
        </Route>

        <Route
          path="/practice-exam"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<PracticeExam />} />
          <Route path="content" element={<PracticeExam />} />
        </Route>

        {/* Student Dashboard Route */}
        <Route
          path="/student-dashboard"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
        </Route>

        {/* Faculty Routes */}
        <Route
          path="/faculty/subjects"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<FacultyContent />} />
          <Route path="content" element={<FacultyContent />} />
        </Route>

        <Route
          path="/faculty-dashboard"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<FacultyDashboard />} />
          <Route path="dashboard" element={<FacultyDashboard />} />
        </Route>

        {/* Program Chair Routes */}
        <Route
          path="/program-chair/subjects"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<ProgramChairContent />} />
          <Route path="content" element={<ProgramChairContent />} />
        </Route>

        <Route
          path="/program-chair-dashboard"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<ProgramChairDashboard />} />
          <Route path="dashboard" element={<ProgramChairDashboard />} />
        </Route>

        <Route
          path="/dean/subjects"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<AdminContent />} />
          <Route path="content" element={<AdminContent />} />
        </Route>

        <Route
          path="/admin-dashboard"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Users Route */}
        <Route path="/users" element={<ProtectedRoute element={<Layout />} />}>
          <Route index element={<Users />} />
          <Route path="users" element={<Users />} />
        </Route>

        <Route
          path="/print-questions"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<PrintExam />} />
          <Route path="print" element={<PrintExam />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
