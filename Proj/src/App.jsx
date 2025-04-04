import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/layout"; 
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import ProgramChairDashboard from "./pages/ProgramChairDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ScrollToTop from "./components/scrollToTop";
import TestLogin from  "./pages/testLogin";
import Users from "./pages/users";

function App() {
  return (
    <Router>
      <ScrollToTop/>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/testLogin" element={<TestLogin />} />

        <Route path="/student" element={<Layout />}>
          <Route index element={<StudentDashboard />} /> {/* Default for /student */}
          <Route path="dashboard" element={<StudentDashboard />} />
        </Route>

        <Route path="/Instructor" element={<Layout />}>
          <Route index element={<FacultyDashboard />} />
          <Route path="dashboard" element={<FacultyDashboard />} />
        </Route>

        <Route path="/Program Chair" element={<Layout />}>
          <Route index element={<ProgramChairDashboard />} />
          <Route path="dashboard" element={<ProgramChairDashboard />} />
        </Route>

        <Route path="/Dean" element={<Layout />}>
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
