import { useRouter } from "next/router";

export const PROJECT_ID_KEY = "selectedProject";

export const projectId =
  typeof window !== "undefined" && localStorage.getItem(PROJECT_ID_KEY);

const useProject = () => {
  const {
    query: { projectId: routerProjectId },
    push,
  } = useRouter();

  const activeProjectId =
    routerProjectId ||
    (typeof window !== "undefined" && localStorage.getItem(PROJECT_ID_KEY));

  const appendProjectId = (path) => {
    return `/projects/${activeProjectId}${path}`;
  };

  const setCurrentProject = (project, shouldRedirect = true) => {
    localStorage.setItem(PROJECT_ID_KEY, project.id);
    shouldRedirect && push(`/projects/${project.id}`);
  };

  return {
    appendProjectId,
    activeProjectId,
    setCurrentProject,
  };
};

export default useProject;
