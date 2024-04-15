/**
 * This page is solely for the purpose of redirecting user to their default project
 */

import { useRouter } from "next/router";
import React, { useEffect } from "react";

export default function Dashboard() {
  const { push } = useRouter();
  useEffect(() => {
    const currentProject = localStorage.getItem("currentProject");

    if (currentProject) {
      console.log("Redirecting to project: ", currentProject);
      push(`/dashboard/projects/${currentProject}`);
    }
  }, []);
  return <div />;
}
