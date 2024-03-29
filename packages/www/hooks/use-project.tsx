export const projectId =
  typeof window !== "undefined" && localStorage.getItem("currentProject");

export default function useProject() {
  const setCurrentProject = (project) => {
    localStorage.setItem("currentProject", project.id);
    window.location.reload();
  };

  return {
    setCurrentProject,
    currentProject: projectId,
  };
}
