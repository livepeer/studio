import qs from "qs";
import { ApiState } from "../types";
import { SetStateAction } from "react";

// temporary:
// TODO: Import the Project type from @livpeer.studio/api
type Project = {
  id: string;
  name: string;
  createdAt: number;
};

let context: any;
let setState: (value: SetStateAction<ApiState>) => void;

export const setSharedScope = (
  _context: any,
  _setState: (value: SetStateAction<ApiState>) => void
) => {
  context = _context;
  setState = _setState;
};

export const createProject = async (params): Promise<Project> => {
  const [res, project] = await context.fetch(`/project`, {
    method: "POST",
    body: JSON.stringify(params),
    headers: {
      "content-type": "application/json",
    },
  });

  if (res.status !== 201) {
    throw new Error(project.errors.join(", "));
  }
  return project;
};

export const getProject = async (projectId): Promise<Project> => {
  const [res, project] = await context.fetch(`/project/${projectId}`);
  if (res.status !== 200) {
    throw project && typeof project === "object"
      ? { ...project, status: res.status }
      : new Error(project);
  }
  return project;
};

export const getProjects = async (): Promise<Project[]> => {
  const [res, projects] = await context.fetch(`/project`);
  if (res.status !== 200) {
    throw projects && typeof projects === "object"
      ? { ...projects, status: res.status }
      : new Error(projects);
  }
  return projects;
};

export const deleteProject = async (projectId) => {
  const [res, project] = await context.fetch(`/project/${projectId}`, {
    method: "DELETE",
  });
  if (res.status !== 204) {
    throw project && typeof project === "object"
      ? { ...project, status: res.status }
      : new Error(project);
  }
};
