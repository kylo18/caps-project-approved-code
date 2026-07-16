import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import ScoreHistory from "./pages/ScoreHistory";
import Leaderboard from "./pages/Leaderboard";
import ContentAnalytics from "./pages/ContentAnalytics";
import DifficultyAnalytics from "./pages/DifficultyAnalytics";

import Users from "./pages/Users";

import AdminContent from "./pages/AdminContent";
import ProgramChairContent from "./pages/ProgramChairContent";
import FacultyContent from "./pages/FacultyContent";
import AssoDeanContent from "./pages/AssoDeanContent";

import PracticeExamResults from "./pages/PracticeExamResults";
import PracticeExam from "./pages/PracticeExam";
import PracticeExamPreview from "./pages/PracticeExamPreview";

import ResetPasswordPage from "./components/resetPassForm";
import ForgotPasswordForm from "./components/forgotPassForm";
import ResetUserCodePage from "./components/resetUserCodeForm";
import ForgotUserCodeForm from "./components/forgotUserCodeForm";
import PracticeExamInfo from "./pages/PracticeExamInfo";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";

import PrintQualifyingExam from "./pages/PrintQualifyingExam";
import PrintPersonalQuiz from "./pages/PrintPersonalQuiz";
import SubjectOverview from "./pages/SubjectOverview";

import Libraries from "./pages/Libraries";  //this is for quizzes in sidebar
import Sessions from "./pages/Sessions";    //this is for Sessions in sidebar
import Reports from "./pages/Reports";     
import Class from "./pages/Class";
import ClassContent from "./pages/ClassContent";
import StudentClasses from "./pages/StudentClasses";
import ArchivedClass from "./pages/ArchivedClass";
import ArchivedQuiz from "./pages/ArchivedQuiz";

import SubjectList from "./pages/SubjectList";

import SubjectsArchive from "./pages/SubjectsArchive";

import LandingPage from "./pages/LandingPage";

import QuizOverview from "./pages/QuizOverview";
import QuizContent from "./pages/QuizContent";
import QuizInfo from "./pages/QuizInfo";
import StudentQuiz from "./pages/StudentQuiz";
import StudentQuizResults from "./pages/StudentQuizResults";

//new added: this is for support page
import SupportPage from "./pages/SupportPage";

//new added: this is for student enhancement page
import StudentEnhancement from "./pages/StudentEnhancement"; // adjust path if needed

//new added: this is for admin student enhancement page
import AdminStudentEnhancement from "./pages/AdminStudentEnhancement";

//new added: this is for students analytics
import AnalyticsPage from "./pages/AnalyticsPage";

function App() {
  return (
    <Router>
      <Routes>
        {/*<Route path="/" element={<Login />} />*/}
        <Route path="/" element={<LandingPage />} />  {/*route for the landing page*/}
        
       

        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-user-code" element={<ResetUserCodePage />} />
        <Route path="/forgot-user-code" element={<ForgotUserCodeForm />} />
        <Route path="/team-caps" element={<Credits />} />
        {/*<Route path="/google-auth-callback" element={<GoogleAuthCallback />} />*/}
        <Route path="/google-auth-callback" element={<GoogleAuthCallback />} />
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />

        {/* Public Landing Page */}
        {/**<Route path="/landing" element={<LandingPage />} />*/}

        {/* Libraries - Personal quizzes */}
        <Route
          path="/libraries"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<Libraries />} />
        </Route>

        {/* Sessions */}
        <Route
          path="/sessions"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<Sessions />} />
        </Route>

        {/* Class */}
        <Route path="/class" element={<ProtectedRoute element={<Layout />} />}>
          <Route index element={<Class />} />
          <Route path=":classID/students" element={<ClassContent />} />
          <Route path=":classID/quizzes" element={<StudentClasses />} />
        </Route>

        {/* Class */}
        <Route
          path="/archived-class"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<ArchivedClass />} />
        </Route>

        {/* Archived quizzes */}
        <Route
          path="/archived-quiz"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<ArchivedQuiz />} />
        </Route>

        {/* Reports */}
        <Route
          path="/reports"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<Reports />} />
        </Route>

        {/* Public Documentation Page */}
        <Route path="/help" element={<TutorialLayout />} />

        {/* Protected Routes */}
        <Route
          path="/practice-exam-result"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<PracticeExamResults />} />
          <Route path="content" element={<PracticeExamResults />} />
        </Route>

        <Route
          path="/print-qualification-exam"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<PrintQualifyingExam />} />
          <Route path="content" element={<PrintQualifyingExam />} />
        </Route>

        <Route
          path="/print-personal-quiz"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<PrintPersonalQuiz />} />
          <Route path="content" element={<PrintPersonalQuiz />} />
        </Route>

        <Route
          path="/practice-exam"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<PracticeExam />} />
          <Route path="content" element={<PracticeExam />} />
        </Route>

        <Route
          path="/practice-exam/preview/:subjectID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<PracticeExamPreview />} />
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

        {/* Analytics Routes 
        <Route
          path="/analytics/achievements"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<ScoreHistory />} />
        </Route>
        <Route
          path="/analytics/leaderboards"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<Leaderboard />} />
        </Route>
        <Route
          path="/analytics/content-analytics"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<ContentAnalytics />} />
        </Route>
        <Route
          path="/analytics/difficult-analytics"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<DifficultyAnalytics />} />
        </Route>  */}
        
        <Route
          path="/analytics/achievements"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<AnalyticsPage />} />
        </Route>
        <Route
          path="/analytics/leaderboards"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<AnalyticsPage />} />
        </Route>
        <Route
          path="/analytics/content-analytics"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<AnalyticsPage />} />
        </Route>
        <Route
          path="/analytics/difficult-analytics"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<AnalyticsPage />} />
        </Route>

        {/* Faculty Routes */}
        <Route
          path="/faculty/subjects"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<SubjectList />} />
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
          <Route index element={<SubjectList />} />
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
          <Route index element={<SubjectList />} />
          <Route path="archive" element={<SubjectsArchive />} />
          <Route path="content" element={<AdminContent />} />
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
          <Route index element={<SubjectList />} />
          <Route path="archive" element={<SubjectsArchive />} />
          <Route path="content" element={<AdminContent />} />
        </Route>

        <Route
          path="/dean-dashboard"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Subject Overview Route (dynamic subjectID) */}
        <Route
          path="/subject-overview/:subjectID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<SubjectOverview />} />
        </Route>

        <Route
          path="/quiz-overview"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<QuizOverview />} />
        </Route>

        <Route
          path="/quiz-content"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<QuizContent />} />
        </Route>

        <Route
          path="/quiz-info/:classPersonalQuizID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<QuizInfo />} />
        </Route>

        <Route
          path="/quiz/:classPersonalQuizID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<StudentQuiz />} />
        </Route>

        <Route
          path="/quiz-result/:classPersonalQuizID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<StudentQuizResults />} />
        </Route>

        
        <Route  //new added: for support page
          path="/support"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<SupportPage />} />
        </Route>

        {/* Users Route */}
        <Route path="/users" element={<ProtectedRoute element={<Layout />} />}>
          <Route index element={<Users />} />
          <Route path="users" element={<Users />} />
        </Route>

        {/*new added: for student enhancement page */}
        <Route
          path="/analytics/enhancement"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<StudentEnhancement />} />
        </Route>

        {/*new added: for admin student page*/}
        <Route
          path="/admin/enhancement"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route index element={<AdminStudentEnhancement />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
