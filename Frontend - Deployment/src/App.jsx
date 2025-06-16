import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/layout";
import ProtectedRoute from "./components/protectRoute";
import TutorialLayout from "./components/TutorialLayout";

import Credits from "./pages/Credits";

import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import ProgramChairDashboard from "./pages/ProgramChairDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AssoDeanDashboard from "./pages/AssoDeanDashboard";

import Users from "./pages/Users";

import AdminContent from "./pages/AdminContent";
import ProgramChairContent from "./pages/ProgramChairContent";
import FacultyContent from "./pages/FacultyContent";
import AssoDeanContent from "./pages/AssoDeanContent";

import PracticeExamResults from "./pages/PracticeExamResults";
import PracticeExam from "./pages/PracticeExam";

import ResetPasswordPage from "./components/resetPassForm";
import ForgotPasswordForm from "./components/forgotPassForm";
import PracticeExamInfo from "./pages/PracticeExamInfo";

import TestLogin from "./tests/testLogin";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/testLogin" element={<TestLogin />} />

        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/team-caps" element={<Credits />} />

        <Route path="/help" element={<ProtectedRoute element={<Layout />} />}>
          <Route index element={<TutorialLayout />} />
          <Route path="content" element={<TutorialLayout />} />
        </Route>

        {/* Protected Routes */}
        <Route
          path="/practice-exam-result"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<PracticeExamResults />} />
          <Route path="content" element={<PracticeExamResults />} />
        </Route>

        <Route
          path="/practice-exam"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<PracticeExam />} />
          <Route path="content" element={<PracticeExam />} />
        </Route>

        <Route
          path="/exam-preview"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<PracticeExamInfo />} />
          <Route path="content" element={<PracticeExamInfo />} />
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
          path="/asso-dean/subjects"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<AssoDeanContent />} />
          <Route path="content" element={<AssoDeanContent />} />
        </Route>

        <Route
          path="/asso-dean-dashboard"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<AssoDeanDashboard />} />
          <Route path="dashboard" element={<AssoDeanDashboard />} />
        </Route>

        <Route
          path="/dean/subjects"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<AdminContent />} />
          <Route path="content" element={<AdminContent />} />
        </Route>

        <Route
          path="/dean-dashboard"
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
      </Routes>
    </Router>
  );
}

export default App;
