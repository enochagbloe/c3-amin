import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MainContentClient from "./maincontent";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }
  
  return <MainContentClient />;
}
