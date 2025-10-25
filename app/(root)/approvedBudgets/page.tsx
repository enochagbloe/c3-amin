"use client";
import { ReusableDataTable } from "@/components/ReuableDataTable";
import React, { useState } from "react";
import { columns } from "./columns";
import type { ApprovedBudgets } from "./columns";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

const ApprovedBudgets = () => {
  const [tableData, setTableData] = useState<ApprovedBudgets[]>([]);
  const [total, setTotal] = useState<number>(0); // ✅ store total properly

  React.useEffect(() => {
    const fetchData = async () => {
      const result = await fetch("/api/budgetTracker?status=approved").then(
        (res) => res.json()
      );

      setTableData(result.data);
      setTotal(result.totalAmount); // ✅ coming from the API (best practice)
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold my-12">View your approved budgets</h1>
      <Card className="flex my-8">
        <CardHeader>
          <CardTitle className="text-2xl">
            <span className="text-green-600">
              {" "}
              {formatNumber(total)} Ghanaian Cedi
            </span>
          </CardTitle>
          <CardTitle>Approved Budgets</CardTitle>
        </CardHeader>
      </Card>
      <ReusableDataTable columns={columns} data={tableData} />
    </div>
  );
};

export default ApprovedBudgets;
