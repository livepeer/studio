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

  const setCurrentProject = (project, path?: string) => {
    localStorage.setItem(PROJECT_ID_KEY, project.id);
    push(`/projects/${project.id}${path ?? ""}`);
  };

  return {
    appendProjectId,
    activeProjectId,
    setCurrentProject,
  };
};

export default useProject;
