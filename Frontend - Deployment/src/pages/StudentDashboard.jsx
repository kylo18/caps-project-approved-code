import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const navigate = useNavigate();

  const handleNavigateToExamForm = () => {
    navigate("/practice-exam"); // Replace with the actual path of the new page
  };

  return (
    <div className="mt-10 text-center text-gray-500">
      <p>Student Dashboard</p>

      <button
        onClick={handleNavigateToExamForm}
        className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
      >
        Open Practice Exam Form
      </button>
    </div>
  );
};

export default StudentDashboard;
