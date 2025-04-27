import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/layout";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import ProgramChairDashboard from "./pages/ProgramChairDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ScrollToTop from "./components/scrollToTop";
import Users from "./pages/Users";
import AdminContent from "./pages/AdminContent";
import ProgramChairContent from "./pages/ProgramChairContent";
import FacultyContent from "./pages/FacultyContent";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/student" element={<Layout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
        </Route>

        <Route path="/faculty/subjects" element={<Layout />}>
          <Route index element={<FacultyContent />} />
          <Route path="content" element={<FacultyContent />} />
        </Route>

        <Route path="/faculty-dashboard" element={<Layout />}>
          <Route index element={<FacultyDashboard />} />
          <Route path="dashboard" element={<FacultyDashboard />} />
        </Route>

        <Route path="/program-chair/subjects" element={<Layout />}>
          <Route index element={<ProgramChairContent />} />
          <Route path="content" element={<ProgramChairContent />} />
        </Route>

        <Route path="/program-chair-dashboard" element={<Layout />}>
          <Route index element={<ProgramChairDashboard />} />
          <Route path="dashboard" element={<ProgramChairDashboard />} />
        </Route>

        <Route path="/Dean/subjects" element={<Layout />}>
          <Route index element={<AdminContent />} />
          <Route path="content" element={<AdminContent />} />
        </Route>

        <Route path="/admin-dashboard" element={<Layout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="/users" element={<Layout />}>
          <Route index element={<Users />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
