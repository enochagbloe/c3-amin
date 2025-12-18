import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MainContentClient from "./page";

export default async function MainContent() {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  return <MainContentClient />;
}
