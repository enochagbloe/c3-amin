import React from "react";

interface SearchParams {
  searchParams: Promise<{ [key: string]: string | number | boolean }>;
}

const MainContent = ({ searchParams }: { searchParams: SearchParams }) => {
  return (
    <main className="">
      <div className="">
        <div className="">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Main Content Area
          </h2>
          <p className="text-gray-900 dark:text-white">
            This is where you can add your dashboard cards and content.
          </p>
        </div>
      </div>
    </main>
  );
};
export default MainContent;
