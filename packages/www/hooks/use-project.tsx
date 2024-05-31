import { useProjectContext } from "context/ProjectContext";
import { useEffect } from "react";

export let projectId = "";

export const updateProjectId = (id: string) => {
  projectId = id;
};

const useSyncProjectId = () => {
  const { projectId: contextProjectId } = useProjectContext();

  useEffect(() => {
    if (contextProjectId) {
      updateProjectId(contextProjectId);
    }
  }, [contextProjectId]);

  return projectId;
};

export default useSyncProjectId;
