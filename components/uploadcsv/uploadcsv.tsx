import handleError from "@/lib/handler/error";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadCSV() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const file = event.target.files[0];
    const formdata = new FormData();
    formdata.append("file", file);

    setIsLoading(true);

    try {
      const res = await fetch("/api/import-csv", {
        method: "POST",
        body: formdata,
      });

      const result = await res.json();
      console.log(result);

      // Refresh UI after successful upload
      window.location.reload();
    } catch (error) {
      return handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => document.getElementById("csvInput")?.click()}
        disabled={isLoading}
      >
        {isLoading ? "loading..." : "Upload CSV"}
      </button>

      <input
        id="csvInput"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
