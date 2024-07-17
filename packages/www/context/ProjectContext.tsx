"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ProjectContextType {
  projectId: string;
  setProjectId: (id: string) => void;
  clearProjectId: () => void;
  appendProjectId: (path: string) => string;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [projectId, setProjectId] = useState<string>(() => {
    // Get initial value from localStorage if it exists
    if (typeof window !== "undefined") {
      return localStorage.getItem("projectId") || "";
    }
    return "";
  });

  useEffect(() => {
    if (searchParams.get("projectId")) {
      setProjectId(searchParams.get("projectId") as string);
    }
  }, [searchParams]);

  // useEffect(() => {
  //   if (projectId) {
  //     // Save projectId to localStorage
  //     localStorage.setItem("projectId", projectId);
  //     router.replace({
  //       query: {
  //         ...router.query,
  //         projectId,
  //       },
  //     });
  //   }
  // }, [projectId]);

  const appendProjectId = (path: string) => {
    if (!projectId) {
      return "";
    }
    return `/projects/${projectId}${path}`;
  };

  const clearProjectId = () => {
    setProjectId("");
    localStorage.removeItem("projectId");
  };

  return (
    <ProjectContext.Provider
      value={{ projectId, setProjectId, appendProjectId, clearProjectId }}>
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
