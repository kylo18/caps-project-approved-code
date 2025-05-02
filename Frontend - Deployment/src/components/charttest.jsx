import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register chart components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Chart data
const data = {
  labels: ["Math", "Science", "English", "History"],
  datasets: [
    {
      label: "Average Score",
      data: [85, 90, 78, 70],
      backgroundColor: "#4F46E5", // Tailwind indigo-600
      borderRadius: 10,
    },
  ],
};

// Chart options
const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

export default function BarChartCard() {
  return (
    <div className="mx-auto h-40 w-full max-w-full rounded-lg bg-white p-4 shadow-md sm:h-48 md:h-56 lg:h-64">
      <h2 className="mb-4 text-xl font-bold text-gray-800">Subject Scores</h2>
      <Bar data={data} options={options} />
    </div>
  );
}
