// __tests__/issue.noFileWorkflow.int.test.js
// ---------------------------------------------------------------------------
// Regression cover for the "no-file workflow" issue path — the flow the product
// actually uses: an admin creates a certification case with NO upload, the
// reviewer approves it, and the Final Certificate PDF is uploaded at ISSUE time.
//
// That path was broken end-to-end. submitDocument's no-file branch only mirrored
// a placeholder row into Mongo (its comment promised the PDF would be "anchored
// on-chain later, at issue time"), and issueDocument then called
// issue_certificate directly. The contract requires the hash to already exist
// on-chain as a Submitted document, so every issue failed:
//   real adapter -> HostError: Error(WasmVm, InvalidAction)
//   stub adapter -> "document not found"
// Two very different-looking errors, one missing store_document.
//
// These tests run against the stub, which enforces the same preconditions as the
// deployed contract (unique hash, actor must be main-admin/whitelisted, issue
// only from Submitted) — so a regression here fails without needing a network.
// ---------------------------------------------------------------------------
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../src/models/User');
const Certificate = require('../src/models/Certificate');
const Web3Tx = require('../src/models/Web3Tx');

const companyService = require('../src/services/company.service');
const subadminService = require('../src/services/subadmin.service');
const documentService = require('../src/services/document.service');
const { createStubAdapter } = require('../src/services/sorobanAdapter/stub');

let mongoServer;
let adapter;

// Wallet secrets are encrypted at rest; without a key the custodial-wallet guard
// refuses to store them and company registration fails before we reach the flow
// under test.
process.env.KEY_ENCRYPTION_SECRET =
  process.env.KEY_ENCRYPTION_SECRET || 'test-key-encryption-secret-value';

const pdf = (s) => Buffer.from(`%PDF-1.4 ${s}`);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'testdb' });
});
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
});
beforeEach(async () => {
  for (const k in mongoose.connection.collections) {
    await mongoose.connection.collections[k].deleteMany({});
  }
  adapter = createStubAdapter();
});

/** Approved company + active reviewer — the state a real issue happens from. */
async function setup() {
  const registered = await companyService.registerCompany({
    name: 'Acme AI Corp',
    email: 'admin@acme-ai.com',
    password: 'Passw0rd1',
  });
  const company = await companyService.approveCompany(registered.id, { adapter });
  const adminUser = await User.findOne({ companyId: registered.id });

  const sa = await subadminService.inviteSubAdmin({ name: 'Reviewer', email: 'rev@aitt.io' });
  await subadminService.activateSubAdmin(sa.id, { adapter });
  const reviewerUser = await User.findOne({ subAdminId: sa.id });

  return { company, adminUser, reviewerUser };
}

/** Create a workflow with NO file, then approve it — ready to issue. */
async function approvedWorkflow({ company, adminUser, reviewerUser }) {
  const wf = await documentService.submitDocument({
    buffer: null, // the whole point: no upload at creation time
    filename: 'AI Governance certification',
    subject: 'AI Governance',
    companyId: company.id,
    requestedByUserId: adminUser._id,
    adapter,
  });
  await documentService.reviewDocument({
    id: wf.id,
    reviewerUserId: reviewerUser._id,
    decision: 'approved',
    complianceScore: 88,
    adapter,
  });
  return wf;
}

describe('issuing a workflow created without a file', () => {
  it('anchors the uploaded PDF on-chain and issues', async () => {
    const ctx = await setup();
    const wf = await approvedWorkflow(ctx);

    // Precondition: nothing is on-chain yet for this workflow.
    const before = await Certificate.findById(wf.id);
    expect(before.chain?.txHashStore).toBeFalsy();

    const issued = await documentService.issueDocument({
      id: wf.id,
      issuerUserId: ctx.adminUser._id,
      buffer: pdf('final-certificate'),
      filename: 'TEST - PDF Certification 6.pdf',
      mimeType: 'application/pdf',
      adapter,
    });

    expect(issued.status).toBe('issued');

    const after = await Certificate.findById(wf.id);
    // The PDF's own hash becomes the verifiable on-chain hash...
    expect(after.metadataHash).toMatch(/^[a-f0-9]{64}$/);
    expect(after.metadataHash).not.toBe(before.metadataHash);
    // ...anchored BEFORE issuing, which is what the contract requires.
    expect(after.chain.txHashStore).toBeTruthy();
    expect(after.chain.txHashIssue).toBeTruthy();
    expect(after.chain.certificateStatus).toBe('Issued');
  });

  it('records both chain writes in the audit trail', async () => {
    const ctx = await setup();
    const wf = await approvedWorkflow(ctx);

    await documentService.issueDocument({
      id: wf.id,
      issuerUserId: ctx.adminUser._id,
      buffer: pdf('audit-trail'),
      filename: 'cert.pdf',
      mimeType: 'application/pdf',
      adapter,
    });

    const purposes = (await Web3Tx.find({ purpose: { $in: ['store', 'issue'] } }).lean())
      .map((t) => t.purpose);
    // 'store' twice: once for the company registration flow's own document (none
    // here) — what matters is that the issue-time store and the issue both ran.
    expect(purposes).toEqual(expect.arrayContaining(['store', 'issue']));
  });

  it('makes the issued certificate publicly verifiable by its PDF hash', async () => {
    const ctx = await setup();
    const wf = await approvedWorkflow(ctx);

    await documentService.issueDocument({
      id: wf.id,
      issuerUserId: ctx.adminUser._id,
      buffer: pdf('verify-me'),
      filename: 'cert.pdf',
      mimeType: 'application/pdf',
      adapter,
    });

    const cert = await Certificate.findById(wf.id);
    const verify = await documentService.verifyDocument({ hashOrId: cert.metadataHash, adapter });

    expect(verify.verified).toBe(true);
    expect(verify.certificateStatus).toBe('Issued');
  });

  it('still rejects a PDF whose hash is already registered', async () => {
    const ctx = await setup();
    const first = await approvedWorkflow(ctx);
    const same = pdf('identical-bytes');

    await documentService.issueDocument({
      id: first.id,
      issuerUserId: ctx.adminUser._id,
      buffer: same,
      filename: 'cert.pdf',
      mimeType: 'application/pdf',
      adapter,
    });

    // A second workflow issued with the SAME bytes must not double-anchor: the
    // contract enforces unique hashes, so this has to fail cleanly at the API
    // boundary rather than as a chain panic.
    const second = await approvedWorkflow(ctx);
    await expect(
      documentService.issueDocument({
        id: second.id,
        issuerUserId: ctx.adminUser._id,
        buffer: same,
        filename: 'cert.pdf',
        mimeType: 'application/pdf',
        adapter,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('does not re-anchor a workflow that was already stored on-chain', async () => {
    const ctx = await setup();

    // Created WITH a file this time — store_document already ran at submit.
    const doc = await documentService.submitDocument({
      buffer: pdf('submitted-with-file'),
      filename: 'company-doc.pdf',
      subject: 'AI Transparency',
      mimeType: 'application/pdf',
      companyId: ctx.company.id,
      requestedByUserId: ctx.adminUser._id,
      adapter,
    });
    await documentService.reviewDocument({
      id: doc.id,
      reviewerUserId: ctx.reviewerUser._id,
      decision: 'approved',
      complianceScore: 90,
      adapter,
    });

    const before = await Certificate.findById(doc.id);
    expect(before.chain.txHashStore).toBeTruthy();

    await documentService.issueDocument({
      id: doc.id,
      issuerUserId: ctx.adminUser._id,
      buffer: pdf('final-cert-for-already-anchored'),
      filename: 'final.pdf',
      mimeType: 'application/pdf',
      adapter,
    });

    const after = await Certificate.findById(doc.id);
    // The original anchor (and hash) stand — re-anchoring would orphan the
    // document the company actually submitted.
    expect(after.chain.txHashStore).toBe(before.chain.txHashStore);
    expect(after.metadataHash).toBe(before.metadataHash);
    expect(after.chain.certificateStatus).toBe('Issued');
  });
});
