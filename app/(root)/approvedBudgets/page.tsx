"use client";
import { ReusableDataTable } from "@/components/ReuableDataTable";
import React, { useState } from "react";
import { columns } from "./columns";
import type { ApprovedBudgets } from "./columns";


const data: ApprovedBudgets[] = [];

const ApprovedBudgets = () => {
  const [tableData, setTableData] = useState<ApprovedBudgets[]>(data);

  React.useEffect(() => {
    const fetchData = async () => {
     const result = await fetch("/api/budgetTracker").then((res) => res.json());
     const approvedBudget = result.data.filter((item: ApprovedBudgets) => item.status === "approved");
      setTableData(approvedBudget);
    };
    fetchData();
  }, []);

  return (
    <div>
      Approved
      <div>
        <ReusableDataTable columns={columns} data={tableData} />
      </div>
    </div>
  );
};

export default ApprovedBudgets;
