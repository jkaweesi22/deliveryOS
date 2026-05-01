function hasLabel(labels: string[], name: string): boolean {
  return labels.some((l) => l.toLowerCase() === name.toLowerCase());
}

export interface TelegramContext {
  eventName: string;
  eventAction: string;
  actor: string;
  issue?: { title: string; htmlUrl: string; labels: string[] };
  commentBody?: string;
  releaseApprover: string;
  /** Branch name for “PR/MR merged to default branch” Telegram rule (default `main`). */
  defaultBranch?: string;
  pullRequest?: {
    merged: boolean;
    baseRef: string;
    title: string;
    htmlUrl: string;
  };
  timestamp: string;
}

/** Build Telegram text (plain newlines; caller may URL-encode for GET). Port of telegram-issues.yml */
export function buildTelegramMessage(ctx: TelegramContext): string | null {
  const {
    eventName,
    eventAction,
    actor,
    issue,
    commentBody,
    releaseApprover,
    pullRequest,
    timestamp,
    defaultBranch = 'main',
  } = ctx;

  if (eventName === 'issues' && issue) {
    const { title, htmlUrl, labels } = issue;

    if (hasLabel(labels, 'bug')) {
      if (eventAction === 'opened')
        return `🟢🪲 BUG OPENED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
      if (eventAction === 'reopened')
        return `🟡♻️ BUG REOPENED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
      if (eventAction === 'closed')
        return `🟣✅ BUG CLOSED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
    }

    if (hasLabel(labels, 'qa') || hasLabel(labels, 'qa-request')) {
      if (eventAction === 'opened')
        return `🔵🧪 QA REQUEST OPENED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
      if (eventAction === 'reopened')
        return `🟠🔁 QA REQUEST REOPENED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
      if (eventAction === 'closed')
        return `🟢✅ QA REQUEST CLOSED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
    }

    if (hasLabel(labels, 'sprint') && hasLabel(labels, 'planning')) {
      if (eventAction === 'opened')
        return `🟣📋 SPRINT CREATED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
    }

    if (hasLabel(labels, 'sprint-active')) {
      if (eventAction === 'opened')
        return `🟡🛠️ SPRINT TASK CREATED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
      if (eventAction === 'closed')
        return `🟢✅ SPRINT TASK COMPLETED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
    }

    if (hasLabel(labels, 'production')) {
      if (eventAction === 'opened')
        return `🚀📦 PRODUCTION RELEASE CREATED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
      if (eventAction === 'closed')
        return `🟣🚀 RELEASE CLOSED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
    }
  }

  if (eventName === 'issue_comment' && issue && commentBody !== undefined) {
    const { title, htmlUrl, labels } = issue;
    const comment = commentBody.slice(0, 300);

    if (
      actor === releaseApprover &&
      /declined|reject|not approved/i.test(commentBody)
    ) {
      return `🔴🛑 RELEASE DECLINED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
    }

    if (actor === releaseApprover && /^approved/im.test(commentBody)) {
      return `🟢🛡️ RELEASE APPROVED\n${title}\n${htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
    }

    if (hasLabel(labels, 'bug'))
      return `💬🪲 BUG COMMENT\n${title}\n${htmlUrl}\n---\n${comment}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
    if (hasLabel(labels, 'qa') || hasLabel(labels, 'qa-request'))
      return `💬🧪 QA COMMENT\n${title}\n${htmlUrl}\n---\n${comment}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
    if (hasLabel(labels, 'production'))
      return `💬🚀 RELEASE COMMENT\n${title}\n${htmlUrl}\n---\n${comment}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
    if (hasLabel(labels, 'sprint-active'))
      return `💬🛠️ SPRINT TASK COMMENT\n${title}\n${htmlUrl}\n---\n${comment}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
  }

  if (eventName === 'pull_request' && pullRequest) {
    if (pullRequest.merged && pullRequest.baseRef === defaultBranch) {
      return `🟢🔀 PR MERGED TO MAIN\n${pullRequest.title}\n${pullRequest.htmlUrl}\n---\n👤 ${actor}\n🕒 ${timestamp}`;
    }
  }

  return null;
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Telegram API error ${res.status}: ${errText}`);
  }
}
