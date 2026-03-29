const nodemailer = require('nodemailer');

// ═══════════════════════════════════════════════════════════════════════
// EMAIL SERVICE — Nodemailer + Brevo SMTP
// ═══════════════════════════════════════════════════════════════════════
//
// Triggered automatically by the workflow engine at every expense
// status change. All functions are fire-and-forget (non-blocking).
//
// Email events:
//   1. Expense submitted       → notify first approver
//   2. Forwarded               → notify next approver
//   3. Step approved           → notify employee (more steps remain)
//   4. Fully approved          → notify employee
//   5. Rejected                → notify employee with reason
// ═══════════════════════════════════════════════════════════════════════

// ── Transporter (singleton) ──────────────────────────────────────────

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // TLS via STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

const FROM = `"${process.env.SMTP_FROM_NAME || 'Expense System'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`;

// ── Core send helper ─────────────────────────────────────────────────

async function sendMail({ to, subject, html }) {
  try {
    const info = await getTransporter().sendMail({ from: FROM, to, subject, html });
    console.log(`Email sent → ${to} | ${subject} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Email failure should NEVER crash the main request
    console.error(`Email failed → ${to} | ${subject} | Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────
// HTML TEMPLATE BUILDER
// ─────────────────────────────────────────────────────────────────────

/**
 * Wraps any inner HTML content in a branded expense email shell.
 */
function buildTemplate({ title, preheader, body, ctaText, ctaUrl }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',Arial,sans-serif;">

  <!-- Preheader (preview text) -->
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                💼 Expense System
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">
                Smart Expense Reimbursement
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#1e293b;padding:36px 40px;border-left:1px solid #334155;border-right:1px solid #334155;">
              ${body}
            </td>
          </tr>

          <!-- CTA Button -->
          ${ctaText && ctaUrl ? `
          <tr>
            <td style="background:#1e293b;padding:0 40px 32px;border-left:1px solid #334155;border-right:1px solid #334155;text-align:center;">
              <a href="${ctaUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;
                       padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.3px;">
                ${ctaText}
              </a>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid #1e293b;border-top:none;">
              <p style="margin:0;color:#475569;font-size:12px;">
                You received this email because you are part of the expense system.<br/>
                Powered by <strong style="color:#6366f1;">Expense System</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Expense detail card (reused in all emails) ───────────────────────

function expenseCard(expense) {
  const currency = expense.currency || expense.companyCurrency || '';
  const amount = expense.amount != null ? Number(expense.amount).toLocaleString() : '—';
  const convertedAmount = expense.convertedAmount != null
    ? `${expense.companyCurrency || ''} ${Number(expense.convertedAmount).toLocaleString()}`
    : null;

  const rows = [
    { label: '💰 Amount', value: `${currency} ${amount}${convertedAmount ? ` <span style="color:#94a3b8;font-size:12px;">(${convertedAmount})</span>` : ''}` },
    { label: '🏷️ Category', value: expense.category || '—' },
    { label: '📅 Date', value: expense.date ? new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
    { label: '🏪 Merchant', value: expense.merchantName || expense.description || '—' },
  ].map(row => `
    <tr>
      <td style="padding:10px 16px;color:#64748b;font-size:13px;white-space:nowrap;">${row.label}</td>
      <td style="padding:10px 16px;color:#f1f5f9;font-size:14px;font-weight:600;">${row.value}</td>
    </tr>
  `).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#0f172a;border:1px solid #334155;border-radius:10px;margin:20px 0;overflow:hidden;">
      <tr>
        <td style="background:#1e3a5f;padding:10px 16px;" colspan="2">
          <span style="color:#93c5fd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
            Expense Details
          </span>
        </td>
      </tr>
      ${rows}
    </table>`;
}

// ─────────────────────────────────────────────────────────────────────
// 1. EXPENSE SUBMITTED — Notify first approver
// ─────────────────────────────────────────────────────────────────────

/**
 * @param {Object} approver   - User object { name, email }
 * @param {Object} expense    - Expense object
 * @param {Object} employee   - User object { name, email }
 */
async function sendApprovalRequestEmail(approver, expense, employee) {
  const subject = `Action Required: New expense from ${employee.name}`;

  const body = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">
      New Expense Awaiting Your Approval
    </h2>
    <p style="margin:0 0 4px;color:#94a3b8;font-size:14px;">
      Hi <strong style="color:#e2e8f0;">${approver.name}</strong>,
    </p>
    <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;line-height:1.6;">
      <strong style="color:#e2e8f0;">${employee.name}</strong> has submitted an expense claim 
      that requires your approval. Please review the details below and take action.
    </p>
    ${expenseCard(expense)}
    <p style="margin:0;color:#64748b;font-size:12px;">
      Log in to your dashboard to approve or reject this expense.
    </p>`;

  return sendMail({
    to: approver.email,
    subject,
    html: buildTemplate({
      title: subject,
      preheader: `${employee.name} submitted an expense of ${expense.currency} ${expense.amount}`,
      body,
      ctaText: 'Review Expense →',
      ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/approvals`,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────────
// 2. EXPENSE FORWARDED — Notify next approver
// ─────────────────────────────────────────────────────────────────────

/**
 * @param {Object} nextApprover      - User object { name, email }
 * @param {Object} expense           - Expense object
 * @param {Object} employee          - User object { name }
 * @param {string} prevApproverName  - Name of who approved the previous step
 */
async function sendForwardedEmail(nextApprover, expense, employee, prevApproverName) {
  const subject = `Expense forwarded to you for approval — ${employee.name}`;

  const body = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">
      Expense Forwarded to You
    </h2>
    <p style="margin:0 0 4px;color:#94a3b8;font-size:14px;">
      Hi <strong style="color:#e2e8f0;">${nextApprover.name}</strong>,
    </p>
    <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;line-height:1.6;">
      An expense submitted by <strong style="color:#e2e8f0;">${employee.name}</strong> has been 
      approved by <strong style="color:#e2e8f0;">${prevApproverName}</strong> and is now 
      forwarded to you for the next level of approval.
    </p>
    ${expenseCard(expense)}
    <p style="margin:0;color:#64748b;font-size:12px;">
      Log in to your dashboard to approve or reject this expense.
    </p>`;

  return sendMail({
    to: nextApprover.email,
    subject,
    html: buildTemplate({
      title: subject,
      preheader: `Expense from ${employee.name} needs your approval`,
      body,
      ctaText: 'Review Expense →',
      ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/approvals`,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────────
// 3. STEP APPROVED (more steps remain) — Notify employee
// ─────────────────────────────────────────────────────────────────────

/**
 * @param {Object} employee       - User object { name, email }
 * @param {Object} expense        - Expense object
 * @param {string} approverName   - Name of who approved this step
 * @param {number} stepsRemaining - How many more approval steps are left
 */
async function sendStepApprovedEmail(employee, expense, approverName, stepsRemaining) {
  const subject = `Your expense is moving forward — approved by ${approverName}`;

  const body = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">
      ✅ Step Approved!
    </h2>
    <p style="margin:0 0 4px;color:#94a3b8;font-size:14px;">
      Hi <strong style="color:#e2e8f0;">${employee.name}</strong>,
    </p>
    <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;line-height:1.6;">
      Great news! <strong style="color:#e2e8f0;">${approverName}</strong> has approved your 
      expense. It is now moving to the next approver.
      <strong style="color:#e2e8f0;">${stepsRemaining} step${stepsRemaining > 1 ? 's' : ''}</strong> remaining.
    </p>
    ${expenseCard(expense)}
    <p style="margin:0;color:#64748b;font-size:12px;">
      Track the full approval status in your dashboard.
    </p>`;

  return sendMail({
    to: employee.email,
    subject,
    html: buildTemplate({
      title: subject,
      preheader: `${approverName} approved your expense — ${stepsRemaining} step(s) remaining`,
      body,
      ctaText: 'Track Status →',
      ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/expenses`,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────────
// 4. FULLY APPROVED — Notify employee
// ─────────────────────────────────────────────────────────────────────

/**
 * @param {Object} employee  - User object { name, email }
 * @param {Object} expense   - Expense object
 */
async function sendFullyApprovedEmail(employee, expense) {
  const subject = `🎉 Your expense has been fully approved!`;

  const body = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">
      🎉 Expense Fully Approved!
    </h2>
    <p style="margin:0 0 4px;color:#94a3b8;font-size:14px;">
      Hi <strong style="color:#e2e8f0;">${employee.name}</strong>,
    </p>
    <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;line-height:1.6;">
      Your expense has completed all approval steps and has been 
      <strong style="color:#4ade80;">fully approved</strong>. 
      Reimbursement will be processed as per your company's payment schedule.
    </p>
    ${expenseCard(expense)}
    <div style="background:#052e16;border:1px solid #166534;border-radius:8px;padding:14px 16px;margin-top:4px;">
      <p style="margin:0;color:#4ade80;font-size:13px;font-weight:600;">
        ✅ All approvals complete — you're all set!
      </p>
    </div>`;

  return sendMail({
    to: employee.email,
    subject,
    html: buildTemplate({
      title: subject,
      preheader: `Your expense of ${expense.currency} ${expense.amount} has been fully approved`,
      body,
      ctaText: 'View Expense →',
      ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/expenses`,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────────
// 5. REJECTED — Notify employee with reason
// ─────────────────────────────────────────────────────────────────────

/**
 * @param {Object} employee      - User object { name, email }
 * @param {Object} expense       - Expense object
 * @param {string} rejectorName  - Name of who rejected
 * @param {string} comment       - Rejection reason/comment
 */
async function sendRejectedEmail(employee, expense, rejectorName, comment) {
  const subject = `Your expense was rejected by ${rejectorName}`;

  const body = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">
      ❌ Expense Rejected
    </h2>
    <p style="margin:0 0 4px;color:#94a3b8;font-size:14px;">
      Hi <strong style="color:#e2e8f0;">${employee.name}</strong>,
    </p>
    <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;line-height:1.6;">
      Unfortunately, your expense has been 
      <strong style="color:#f87171;">rejected</strong> by 
      <strong style="color:#e2e8f0;">${rejectorName}</strong>.
    </p>
    ${expenseCard(expense)}
    ${comment ? `
    <div style="background:#1c0a0a;border:1px solid #7f1d1d;border-radius:8px;padding:14px 16px;margin-top:4px;">
      <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
        Reason
      </p>
      <p style="margin:0;color:#fca5a5;font-size:14px;line-height:1.5;">
        "${comment}"
      </p>
    </div>` : ''}
    <p style="margin:16px 0 0;color:#64748b;font-size:12px;">
      If you believe this was a mistake, please contact your manager or resubmit with the necessary corrections.
    </p>`;

  return sendMail({
    to: employee.email,
    subject,
    html: buildTemplate({
      title: subject,
      preheader: `Your expense was rejected by ${rejectorName}${comment ? ` — "${comment}"` : ''}`,
      body,
      ctaText: 'View Dashboard →',
      ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/expenses`,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────────
// VERIFY SMTP CONNECTION (call on server startup)
// ─────────────────────────────────────────────────────────────────────

async function verifyEmailConnection() {
  try {
    await getTransporter().verify();
    console.log('✅ Email service connected (Brevo SMTP)');
    return true;
  } catch (err) {
    console.warn('⚠️  Email service not connected:', err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────

module.exports = {
  sendApprovalRequestEmail,   // Expense submitted → notify first approver
  sendForwardedEmail,         // Step approved → notify next approver
  sendStepApprovedEmail,      // Step approved → notify employee (steps remain)
  sendFullyApprovedEmail,     // All steps done → notify employee
  sendRejectedEmail,          // Rejected → notify employee with reason
  verifyEmailConnection,      // Call on server startup to check SMTP
};
