/**
 * Email Service Test
 * Usage: node test-email.js your@email.com
 * Sends a test approval request email to the provided address.
 */

require('dotenv').config();

const {
  verifyEmailConnection,
  sendApprovalRequestEmail,
  sendFullyApprovedEmail,
  sendRejectedEmail,
} = require('./services/email.service');

const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.log('Usage: node test-email.js your@email.com');
  process.exit(1);
}

async function main() {
  console.log('\n🔌 Testing SMTP connection...');
  const connected = await verifyEmailConnection();
  if (!connected) {
    console.error('❌ SMTP connection failed. Check your .env credentials.');
    process.exit(1);
  }

  // Mock data
  const employee = { name: 'Kartik Pagariya', email: recipientEmail };
  const approver  = { name: 'Rohan Sharma', email: recipientEmail };
  const expense = {
    amount: 1530.65,
    currency: 'INR',
    convertedAmount: 1530.65,
    companyCurrency: 'INR',
    category: 'Food',
    date: new Date(),
    merchantName: 'Palnivel Restaurant',
    description: 'Team lunch',
  };

  console.log('\n📧 Sending test emails to:', recipientEmail);
  console.log('─'.repeat(50));

  console.log('\n1️⃣  Sending: Approval Request Email...');
  await sendApprovalRequestEmail(approver, expense, employee);

  console.log('\n2️⃣  Sending: Fully Approved Email...');
  await sendFullyApprovedEmail(employee, expense);

  console.log('\n3️⃣  Sending: Rejected Email...');
  await sendRejectedEmail(employee, expense, 'Rohan Sharma', 'Receipt is unclear, please resubmit with a clearer image.');

  console.log('\n✅ All test emails sent! Check your inbox.');
}

main().catch(console.error);
