/**
 * This page is solely for the purpose of redirecting user to their default project
 *
 * If user has a default project, redirect to that project, else redirect to the first project (default project)
 */

import { useLoggedIn } from "hooks";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

export default function Dashboard() {
  const { push } = useRouter();

  useLoggedIn();

  useEffect(() => {
    push(`/settings/projects`);
  }, []);
  return <div />;
}
