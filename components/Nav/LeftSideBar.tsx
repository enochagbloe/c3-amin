import React from "react";
import { auth } from "@/auth";
import LeftSideBarClient from "./LeftSideBarClient";

const LeftSideBar = async () => {
  const session = await auth();
  const user = session?.user;

  return <LeftSideBarClient user={user} />;
};

export default LeftSideBar;
