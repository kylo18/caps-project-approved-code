import BarChartCard from "../components/charttest";

const AdminDashboard = () => {
  return (
    <div className="mt-10 space-y-4">
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-5 lg:grid-cols-5 lg:grid-rows-5">
        {/* 1 / 14 - Question Bank */}
        <div className="flex items-center justify-between rounded-md bg-white p-4 shadow md:col-span-2 md:col-start-1 md:row-start-1 lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <div>
            <p className="text-sm text-gray-500">Question Bank</p>
            <div className="flex items-end space-x-2">
              <p className="text-2xl font-bold">182</p>
              <p className="mb-0.5 text-xs text-gray-500">Total Questions</p>
            </div>
          </div>
          <button className="ml-4 rounded bg-orange-500 px-3 py-1 text-sm text-white hover:bg-orange-600">
            + Add
          </button>
        </div>

        {/* 2 / 15 - Left Card 1 */}
        <div className="flex items-center justify-between rounded-md bg-gray-200 p-4 shadow md:col-start-1 md:row-span-2 md:row-start-2 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-2">
          <div className="h-6 w-1/3 rounded bg-gray-300"></div>
          <div className="h-16 w-16 rounded-full border-4 border-gray-400"></div>
        </div>

        {/* 3 / 16 - Left Card 2 */}
        <div className="flex items-center justify-between rounded-md bg-gray-200 p-4 shadow md:col-start-1 md:row-span-2 md:row-start-4 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-4">
          <div className="h-6 w-1/3 rounded bg-gray-300"></div>
          <div className="h-16 w-16 rounded-full border-4 border-gray-400"></div>
        </div>

        {/* 4 / 9 - Faculty */}
        <div className="flex h-55 flex-col items-start rounded-md bg-white p-2 shadow md:col-start-3 md:row-span-3 md:row-start-1 lg:col-start-3 lg:row-span-2 lg:row-start-1">
          <div className="flex w-full items-center justify-between rounded-md border border-gray-300 p-2">
            <div>
              <p className="text-sm text-gray-700">Total Faculty</p>
              <p className="text-xl font-semibold">123</p>
            </div>
            <i className="bx bx-chevron-down text-2xl text-gray-500"></i>
          </div>
          <div>
            <BarChartCard />
          </div>
        </div>

        {/* 5 / 11 - Students */}
        <div className="flex items-center justify-between rounded-md bg-gray-200 p-4 shadow md:col-start-2 md:row-span-2 md:row-start-2 lg:col-start-4 lg:row-span-2 lg:row-start-1">
          <div>
            <p className="text-sm text-gray-700">Total Students</p>
            <p className="text-xl font-semibold">12,123</p>
          </div>
          <div className="text-lg text-gray-500">▾</div>
        </div>

        {/* 6 / 12 - Subjects */}
        <div className="flex items-center justify-between rounded-md bg-gray-200 p-4 shadow md:col-start-3 md:row-span-2 md:row-start-4 lg:col-start-5 lg:row-span-2 lg:row-start-1">
          <div>
            <p className="text-sm text-gray-700">Total Subjects</p>
            <p className="text-xl font-semibold">43</p>
          </div>
          <div className="text-lg text-gray-500">▾</div>
        </div>

        {/* 7 / 17 - Bottom Large Card */}
        <div className="rounded-md bg-gray-200 shadow md:col-start-2 md:row-span-2 md:row-start-4 lg:col-span-2 lg:col-start-3 lg:row-span-2 lg:row-start-3"></div>

        {/* 8 - Side Block */}
        <div className="hidden rounded-md bg-gray-200 shadow md:block lg:col-start-5 lg:row-span-2 lg:row-start-3"></div>
      </div>
    </div>
  );
};

export default AdminDashboard;
