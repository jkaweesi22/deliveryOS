/** Comment body for production release notifier (notify-release-approver.yml). */
export function buildReleaseApproverPing(opts: {
  approverLogin: string;
  projectName: string;
  issueTitle: string;
  issueBody: string;
}): string {
  const { approverLogin, projectName, issueTitle, issueBody } = opts;

  let sprintRef = 'Not specified';
  const sprintMatch = issueBody.match(/#\d+/);
  if (sprintMatch) sprintRef = sprintMatch[0];

  let qaRecommendation = 'Not specified';
  if (issueBody.includes('Approve for Production')) qaRecommendation = 'Approve for Production';
  else if (issueBody.includes('Reject Release')) qaRecommendation = 'Reject Release';
  else if (issueBody.includes('Conditional Approval')) qaRecommendation = 'Conditional Approval';

  const projectLine = projectName ? `**Project:** ${projectName}\n\n` : '';

  return (
    `🚨 @${approverLogin} Production Release requires approval.\n\n` +
    projectLine +
    `**Issue:** ${issueTitle}\n\n` +
    `**Linked Sprint:** ${sprintRef}\n\n` +
    `**QA Recommendation:** ${qaRecommendation}\n\n` +
    `Please review the sprint delivery and QA sign-off details above before approving deployment.\n\n` +
    `🔒 Deployment must not proceed without your approval.`
  );
}
