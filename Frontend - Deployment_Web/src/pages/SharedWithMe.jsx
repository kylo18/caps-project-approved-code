import React from "react";

function SharedWithMe() {
  return (
    <div className="ml-56 flex h-full flex-1 flex-col gap-6 p-6 lg:ml-64">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Shared with me
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Quizzes that have been shared with you by other users.
          </p>
        </div>
      </div>

      <div className="flex h-full flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 py-16">
        <div className="text-center">
          <i className="bx bx-share-alt mb-2 text-4xl text-gray-400" />
          <p className="text-sm text-gray-600">
            No quizzes from other teachers have been shared with you yet.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SharedWithMe;
