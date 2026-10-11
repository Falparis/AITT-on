// Demo personas. With no real auth, each role is "acting as" a fixed identity
// from the seed data so the cross-screen data flow is coherent:
//   company submits as DEMO_COMPANY  →  sub_admin reviews as DEMO_REVIEWER
//   →  admin issues as DEMO_ADMIN. DEMO_SIGNER_WALLET signs governance proposals.

export const DEMO_COMPANY = "Acme AI";
export const DEMO_REVIEWER = "Dr. Amara Okafor";
export const DEMO_ADMIN = "Main Admin";
// Matches the seeded sub-admin "Dr. Amara Okafor" wallet (a valid governance signer).
export const DEMO_SIGNER_WALLET =
  "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAI4";
