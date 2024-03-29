export default function useProject() {
  const setCurrentProject = (project) => {
    localStorage.setItem("currentProject", project.id);
    window.location.reload();
  };

  const getCurrentProject = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentProject");
    }
  };

  return {
    setCurrentProject,
    currentProject: getCurrentProject(),
  };
}
