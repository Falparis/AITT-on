// src/services/jobs/treasuryBalance.job.js
// ---------------------------------------------------------------------------
// Central fee-account low-balance monitor (Option 2). Reads the central
// (service) account's XLM balance from Horizon and, when it drops below a
// threshold, raises a monitoring alert + notifies every main admin so they can
// top it up BEFORE company/expert transactions start failing (fee-bumps are
// paid from this account).
//
// Idempotent: keeps a SINGLE open `funding` alert (escalates warning→critical
// in place) and auto-resolves it once the balance recovers.
//
// Thresholds (XLM): TREASURY_MIN_XLM (warn, default 5), TREASURY_CRIT_XLM
// (critical, default 1). Runs on the scheduler under a distributed lock.
// ---------------------------------------------------------------------------
const Alert = require('../../models/Alert');
const User = require('../../models/User');
const logger = require('../../utils/logger');
const { notifyMany } = require('../../utils/notify');
const rpc = require('../sorobanAdapter/rpc');

const horizonUrl = () => {
  const base = process.env.HORIZON_URL
    || (/public/i.test(String(process.env.NETWORK_PASSPHRASE || ''))
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org');
  return base.replace(/\/$/, '');
};

/** Native (XLM) balance for an account; 0 if the account is not yet funded. */
async function readNativeBalance(publicKey) {
  if (typeof fetch !== 'function') throw new Error('global fetch unavailable (Node >= 18 required)');
  const res = await fetch(`${horizonUrl()}/accounts/${publicKey}`);
  if (res.status === 404) return 0; // account does not exist / unfunded
  if (!res.ok) throw new Error(`horizon ${res.status}`);
  const body = await res.json();
  const native = (body.balances || []).find((b) => b.asset_type === 'native');
  return native ? Number(native.balance) : 0;
}

async function runTreasuryBalanceJob({ warnBelow, critBelow } = {}) {
  const warn = Number(warnBelow ?? process.env.TREASURY_MIN_XLM ?? 5);
  const crit = Number(critBelow ?? process.env.TREASURY_CRIT_XLM ?? 1);

  // Only meaningful when the real chain adapter is configured.
  let pub;
  try {
    pub = rpc.getClients().serviceKP.publicKey();
  } catch (_) {
    return { skipped: 'adapter-not-configured' };
  }

  const balance = await readNativeBalance(pub);
  const severity = balance < crit ? 'critical' : balance < warn ? 'warning' : null;

  if (!severity) {
    // Healthy — auto-resolve any open low-balance alert.
    const cleared = await Alert.updateMany(
      { kind: 'funding', resolved: false },
      { $set: { resolved: true } },
    );
    logger.info('Treasury balance OK', { pub: pub.slice(0, 8), balance });
    return { balance, ok: true, alerted: false, cleared: cleared.modifiedCount || 0 };
  }

  const short = `${pub.slice(0, 4)}…${pub.slice(-4)}`;
  const message = severity === 'critical'
    ? `Central fee account (${short}) is critically low: ${balance} XLM. Top up now — company/expert transactions will start failing.`
    : `Central fee account (${short}) is low: ${balance} XLM. Please top it up soon.`;

  // Keep a single open funding alert; escalate its severity/message in place.
  let created = false;
  const existing = await Alert.findOne({ kind: 'funding', resolved: false });
  if (existing) {
    if (existing.severity !== severity || existing.message !== message) {
      existing.severity = severity;
      existing.message = message;
      await existing.save();
    }
  } else {
    await Alert.create({ message, dueDate: new Date(), severity, kind: 'funding' });
    created = true;
  }

  // Notify every main admin.
  const admins = await User.find({ role: 'super_admin' }).select('_id');
  await notifyMany(admins.map((a) => a._id), {
    type: 'warning',
    title: 'Central fee account low',
    message,
    entityType: 'system',
    entityId: 'treasury',
  });

  logger.warn('Treasury balance low', { pub: pub.slice(0, 8), balance, severity, alertCreated: created, admins: admins.length });
  return { balance, severity, alertCreated: created, adminsNotified: admins.length };
}

module.exports = { runTreasuryBalanceJob, readNativeBalance };
