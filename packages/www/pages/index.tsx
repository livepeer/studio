/**
 * This page is solely for the purpose of redirecting user to their default project
 *
 * If user has a default project, redirect to that project, else redirect to the first project (default project)
 */

import { useApi, useLoggedIn } from "hooks";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useQuery } from "react-query";
import { useProjectContext } from "context/ProjectContext";

export default function Dashboard() {
  const { push } = useRouter();
  const { getProjects } = useApi();
  const { setProjectId, projectId } = useProjectContext();
  const { data: projects } = useQuery("projects", getProjects);

  useLoggedIn();

  useEffect(() => {
    push(`/settings/projects`);
  }, []);
  return <div />;
}
