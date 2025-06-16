const AdminDashboard = () => {
  return (
    <div className="mt-10 text-center text-gray-500">
      <p>
        The dashboard will be available soon. To add questions, please select sa
        subject from the sidebar.
      </p>
    </div>

    /*<div className="font-inter mt-2 min-h-screen bg-[#f7f7f8] px-4 py-8">
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-gradient-to-tr from-[#ed3700] to-[#FE6902] p-6 text-white shadow">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium">Questions</span>
            <span className="bx bx-chevrons-down text-lg"></span>
          </div>
          <div className="mt-2 text-2xl font-bold">7,265</div>
        </div>
        <div className="rounded-xl bg-gray-900 p-6 text-white shadow">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium">Pending Questions</span>
            <span className="bx bx-chevrons-down text-lg"></span>
          </div>
          <div className="mt-2 text-2xl font-bold">3,671</div>
        </div>
        <div className="rounded-xl bg-gradient-to-tr from-[#ed3700] to-[#FE6902] p-6 text-white shadow">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium">Users</span>
            <span className="bx bx-chevrons-down text-lg"></span>
          </div>
          <div className="mt-2 text-2xl font-bold">256</div>
        </div>
        <div className="rounded-xl bg-gray-900 p-6 text-white shadow">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium">Subjects</span>
            <span className="bx bx-chevrons-down text-lg"></span>
          </div>
          <div className="mt-2 text-2xl font-bold">2,318</div>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex flex-wrap items-center gap-6 border-b pb-2">
          <div className="flex gap-6 text-sm font-semibold">
            <span className="cursor-pointer text-[#a259ff]">
              Practice Questions
            </span>
            <span className="cursor-pointer text-gray-400">Users</span>
            <span className="cursor-pointer text-gray-400">
              Student Activity
            </span>
          </div>
          <div className="ml-auto flex gap-2">
            <button className="rounded-md border px-3 py-1 text-xs text-gray-500">
              Week
            </button>
            <button className="rounded-md border px-2 py-1 text-xs text-gray-500">
              <i className="bx bx-line-chart"></i>
            </button>
            <button className="rounded-md border px-2 py-1 text-xs text-gray-500">
              <i className="bx bx-dots-horizontal-rounded"></i>
            </button>
          </div>
        </div>
        <div className="h-40 w-full rounded-lg bg-gray-100"></div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 text-sm font-semibold text-blue-600">
            All Student by Program
          </div>
          <div className="h-32 w-full rounded-lg bg-gray-100"></div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 text-sm font-semibold text-green-600">
            All Faculty by Program
          </div>
          <div className="h-32 w-full rounded-lg bg-gray-100"></div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 text-sm font-semibold text-blue-600">
            Traffic by Location
          </div>
          <div className="h-32 w-full rounded-full bg-gray-100"></div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 text-sm font-semibold text-blue-600">
            Traffic by Location
          </div>
          <div className="h-32 w-full rounded-full bg-gray-100"></div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 text-lg font-semibold text-blue-600">
          Question Activity
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 font-medium">Program</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Questions Added</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-2 text-gray-700">&nbsp;</td>
                  <td className="px-4 py-2 text-gray-700">&nbsp;</td>
                  <td className="px-4 py-2 text-gray-700">&nbsp;</td>
                  <td className="px-4 py-2 text-gray-700">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-6 text-xs text-gray-400">
        <span>About</span>
        <span>Support</span>
        <span>Contact Us</span>
      </div>
    </div>*/
  );
};

export default AdminDashboard;
