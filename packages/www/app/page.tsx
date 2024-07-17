/**
 * This page is solely for the purpose of redirecting user to their default project
 *
 * If user has a default project, redirect to that project, else redirect to the first project (default project)
 */

import { redirect } from "next/navigation";

export default function Dashboard() {
  redirect("/settings/projects");
}
