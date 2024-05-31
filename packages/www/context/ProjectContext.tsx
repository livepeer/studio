import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/router";

interface ProjectContextType {
  projectId: string;
  setProjectId: (id: string) => void;
  appendProjectId: (path: string) => string;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");

  useEffect(() => {
    if (router.query.projectId) {
      setProjectId(router.query.projectId as string);
    }
  }, [router.query.projectId]);

  const appendProjectId = (path: string) => {
    return `/projects/${projectId}${path}`;
  };

  return (
    <ProjectContext.Provider
      value={{ projectId, setProjectId, appendProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
};
