// The backend serializers can emit `null` for a few fields the frontend types as
// required strings (filename, company, email, wallet, docId) and omit optional
// ones. Pages call .toLowerCase()/.localeCompare() on these, so we coalesce them
// to safe display values at the client boundary — one place, every page benefits.

import type {
  Alert,
  Company,
  DocItem,
  Proposal,
  Review,
  SubAdmin,
} from "../mock/types";

const s = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

export function normalizeReview(r: Review): Review {
  return {
    ...r,
    reviewer: s(r.reviewer, "Unknown reviewer"),
    comment: s(r.comment),
    commentHash: s(r.commentHash),
  };
}

export function normalizeDocItem(d: DocItem): DocItem {
  return {
    ...d,
    filename: s(d.filename, "(unnamed document)"),
    company: s(d.company, "—"),
    subject: s(d.subject, "—"),
    hash: s(d.hash),
    reviews: Array.isArray(d.reviews) ? d.reviews.map(normalizeReview) : [],
  };
}

export function normalizeCompany(c: Company): Company {
  return {
    ...c,
    name: s(c.name, "(unnamed company)"),
    email: s(c.email),
    wallet: s(c.wallet),
  };
}

export function normalizeSubAdmin(a: SubAdmin): SubAdmin {
  return {
    ...a,
    name: s(a.name, "(unnamed)"),
    email: s(a.email),
    wallet: s(a.wallet),
    reviewsDone: typeof a.reviewsDone === "number" ? a.reviewsDone : 0,
  };
}

export function normalizeProposal(p: Proposal): Proposal {
  return {
    ...p,
    title: s(p.title, "(untitled proposal)"),
    description: s(p.description),
    createdBy: s(p.createdBy, "—"),
    signers: Array.isArray(p.signers) ? p.signers : [],
    approvals: typeof p.approvals === "number" ? p.approvals : (p.signers?.length ?? 0),
  };
}

export function normalizeAlert(a: Alert): Alert {
  return {
    ...a,
    docId: s(a.docId),
    message: s(a.message),
  };
}
