function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
export function invitationEmail(
  organization: string,
  inviter: string,
  url: string,
) {
  return {
    subject: `You're invited to join ${organization}`,
    text: `${inviter} invited you to join ${organization}.\n\nAccept your invitation: ${url}\n\nThis link expires in 7 days. Sign in or create an account with this email address. You will be able to request budgets and follow your own approvals. Ignore this email if you weren't expecting it.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;padding:32px;color:#171717"><h1 style="font-size:24px">Join ${escape(organization)}</h1><p>${escape(inviter)} invited you to the church team.</p><p>Request budgets and follow the status of your own requests.</p><p style="margin:28px 0"><a href="${escape(url)}" style="background:#171717;color:white;padding:12px 20px;border-radius:8px;text-decoration:none">Accept invitation</a></p><p>Sign in or create an account with this email address. This invitation expires in 7 days.</p><p style="color:#666;font-size:12px">If you weren't expecting this invitation, you can ignore this email.</p></div>`,
  };
}
