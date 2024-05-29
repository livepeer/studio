/**
 * This page is solely for the purpose of redirecting user to their default project
 *
 * If user has a default project, redirect to that project, else redirect to the first project (default project)
 */

import { useApi } from "hooks";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useQuery } from "react-query";
import { projectId as selectedProject } from "hooks/use-project";

export default function Dashboard() {
  const { push } = useRouter();
  const { getProjects } = useApi();
  const { data: projects } = useQuery("projects", getProjects);

  useEffect(() => {
    if (selectedProject) {
      push(`/projects/${selectedProject}`);
    } else if (projects?.length > 0) {
      push(`/projects/${projects[0].id}`);
    }
  }, [projects]);
  return <div />;
}
