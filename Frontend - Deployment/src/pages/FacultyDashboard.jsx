import ComingSoon from "../assets/icons/comingsoon.png";

const ProgramChairDashboard = () => {
  return (
    <div className="mt-8 text-center text-gray-500">
      <div className="flex flex-col items-center justify-center py-10">
        <img
          src={ComingSoon}
          alt="Dashboard coming soon "
          className="mb-2 h-32 w-32 opacity-80"
        />
        <span className="w-90 text-[15px] text-gray-500">
          The dashboard will be available soon. To add questions, please select
          sa subject from the sidebar.
        </span>
      </div>
    </div>
  );
};

export default ProgramChairDashboard;
//
