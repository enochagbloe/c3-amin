"use client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/seperator";
import { Calendar, FileText } from "lucide-react";
import { IncomeWithCustomValues } from "@/lib/actions/income.actions";

interface IncomeExpensesClientProps {
  incomeData: IncomeWithCustomValues;
  user: string;
}

export default function IncomeExpensesClient({
  incomeData,
  user,
}: IncomeExpensesClientProps) {
  const router = useRouter();
  const { name, amount, date, description, customValues } = incomeData;

  

  const handleBack = () => {
    router.back();
    router.refresh();
  };

  return (
    <>
      <div>
        <button
          className="text-sm text-slate-500 dark:text-white"
          onClick={handleBack}
        >
          Back
        </button>
      </div>
      <div>
        <h1 className="text-4xl font-bold">Expense Details</h1>
        <div className="container max-w-4xl mx-auto p-6 space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-bold">{name}</CardTitle>
                  <CardDescription>Expense Details</CardDescription>
                </div>
               
              </div>
            </CardHeader>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <p className="w-5 h-5 text-green-600">GH¢ </p> 
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium dark:text-white">
                      Amount
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      GH¢ {amount}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium dark:text-white">
                    Date
                  </p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <Separator />
            </CardContent>
          </Card>

          {/* Description Card */}
          {description && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <CardTitle className="text-xl">Description</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap dark:text-white">
                  {description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Custom Fields Card */}
          {customValues && customValues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Custom Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customValues.map((cv) => (
                  <div key={cv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                    <div>
                      <p className="text-sm text-slate-500 font-medium dark:text-white">
                        {cv.customField.name}
                      </p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {cv.customField.type === 'DATE' 
                          ? new Date(cv.value).toLocaleDateString()
                          : cv.customField.type === 'TOGGLE'
                          ? cv.value === 'true' ? 'Yes' : 'No'
                          : cv.value
                        }
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 px-2 py-1 bg-slate-200 rounded dark:bg-slate-700">
                      {cv.customField.type}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
         <div>{user}</div> 
        </div>
      </div>
    </>
  );
}
