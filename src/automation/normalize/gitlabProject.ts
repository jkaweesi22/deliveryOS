/** Set DELIVERY_OS_PROJECT_ID from webhook body when running outside GitLab CI. */
export function ensureGitlabProjectId(raw: unknown): void {
  const r = raw as { project?: { id?: number }; project_id?: number };
  const pid = r.project?.id ?? r.project_id;
  if (pid != null && !process.env.DELIVERY_OS_PROJECT_ID && !process.env.CI_PROJECT_ID) {
    process.env.DELIVERY_OS_PROJECT_ID = String(pid);
  }
}
