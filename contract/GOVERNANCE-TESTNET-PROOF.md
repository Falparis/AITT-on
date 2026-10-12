# Multisig Governance — Testnet Proof

| | |
|---|---|
| Network | Stellar testnet |
| Contract ID | [`CDQQEMPK3F6ZKURO3CKOUD6GQZ6ZGWOZVENZ4U7BEVFLHDR4MBUN5TJC`](https://stellar.expert/explorer/testnet/contract/CDQQEMPK3F6ZKURO3CKOUD6GQZ6ZGWOZVENZ4U7BEVFLHDR4MBUN5TJC) |
| WASM hash | `f98e917479db7306b64a3866fc97118effc05d62e65fdc478986027141ab5e6e` |
| Main admin | `GAKNE5M3T2OGH6VXEEEM2SWC7S7ZHSECVE2A5VPK7P55PAIVKEH7Z4NA` |
| Sub-admins | `GBHUKOWZ3H7ELZO7MQBT67YNPKH5V5LJK2K6BQGMOMFEJC7IVTOIV3KC`<br>`GAOWCDBR6VZM54TFERXJA4JFJHLDLFAJNYELDY7IMBXQB5CQCB332TBA`<br>`GC2WDDHOPXLOIJXA5BO4VEA2ANJ5NI2XQSEGV2UEEP5A2MK5ZGH4ZYYQ` |
| Threshold | 2 of 3 |
| Revoked certificate hash | `149edefaa4ddd5b412efe1eec2ffae3da5f1784a17ecbcb4239947fae6051e45` |
| Proposal ID | 1 |

## Transactions (in order)

| # | Step | Transaction |
|---|---|---|
| 1 | Upload WASM | [`479eddd081e9485fbe5b1f7c761de6828371301493fabb49dee112e75f5d7aa4`](https://stellar.expert/explorer/testnet/tx/479eddd081e9485fbe5b1f7c761de6828371301493fabb49dee112e75f5d7aa4) |
| 2 | Deploy contract | [`36c59c30039407665b039ae1e9752e6857eea844825634f12eb31fc725f6bbdf`](https://stellar.expert/explorer/testnet/tx/36c59c30039407665b039ae1e9752e6857eea844825634f12eb31fc725f6bbdf) |
| 3 | init (main admin) | [`2730db9e68119ed3ea013223068bdfe6039f58b1ee69225f89aac3d71e6237f3`](https://stellar.expert/explorer/testnet/tx/2730db9e68119ed3ea013223068bdfe6039f58b1ee69225f89aac3d71e6237f3) |
| 4 | add_sub_admin (Sub-admin A) | [`65c9c3872ea57be6558dbf2989d8a7ffc3d6535929479c8826f2fcc53103427f`](https://stellar.expert/explorer/testnet/tx/65c9c3872ea57be6558dbf2989d8a7ffc3d6535929479c8826f2fcc53103427f) |
| 5 | add_sub_admin (Sub-admin B) | [`f9a39d9e1e15bbac8bbd426e095e14ad78ea69188bddec8da70a27cbf974eb6c`](https://stellar.expert/explorer/testnet/tx/f9a39d9e1e15bbac8bbd426e095e14ad78ea69188bddec8da70a27cbf974eb6c) |
| 6 | add_sub_admin (Sub-admin C) | [`e93e925b7ed22126cce791a8c7a81f7ba3dccd4a0f49557cbcc569fefb5a7c89`](https://stellar.expert/explorer/testnet/tx/e93e925b7ed22126cce791a8c7a81f7ba3dccd4a0f49557cbcc569fefb5a7c89) |
| 7 | set_threshold (N = 2) | [`741c626489b412e123f31f9bf42144239f15a820f3dc8029c883b3702a818d68`](https://stellar.expert/explorer/testnet/tx/741c626489b412e123f31f9bf42144239f15a820f3dc8029c883b3702a818d68) |
| 8 | whitelist_address (company) | [`776b7aa1d997d049940fd867581074decab0605fc68822c656b1ed38c37f2d6a`](https://stellar.expert/explorer/testnet/tx/776b7aa1d997d049940fd867581074decab0605fc68822c656b1ed38c37f2d6a) |
| 9 | store_document (company) | [`76451ea5812196e9f3e303100f529914b6f5325cbfe80ef7c575142cecc20420`](https://stellar.expert/explorer/testnet/tx/76451ea5812196e9f3e303100f529914b6f5325cbfe80ef7c575142cecc20420) |
| 10 | issue_certificate | [`fb7cdb2488e5fc3e1802e8595e6b2517515f0f37174fc4d27ad92f1eda8df3f3`](https://stellar.expert/explorer/testnet/tx/fb7cdb2488e5fc3e1802e8595e6b2517515f0f37174fc4d27ad92f1eda8df3f3) |
| 11 | create_proposal (RevokeCertificate) | [`b03dde098f4fb79fdb3bd8c7d405b49f959a68746c49ca05f39b6a2a55f17180`](https://stellar.expert/explorer/testnet/tx/b03dde098f4fb79fdb3bd8c7d405b49f959a68746c49ca05f39b6a2a55f17180) |
| 12 | approve_proposal (Sub-admin A, 1/2) | [`6da6100b0f74b38427c5412c74bc0e4e8b564fe6950d98d29ff390d5c77e389a`](https://stellar.expert/explorer/testnet/tx/6da6100b0f74b38427c5412c74bc0e4e8b564fe6950d98d29ff390d5c77e389a) |
| 13 | approve_proposal (Sub-admin B, 2/2, auto-executes) | [`a547235c59a05cab98e09b29463aeaa4d00e1aa7d1fc41e535162a4fe6878d5b`](https://stellar.expert/explorer/testnet/tx/a547235c59a05cab98e09b29463aeaa4d00e1aa7d1fc41e535162a4fe6878d5b) |

## Results

- Before revocation: certificate **Issued**.
- After approval 1 of 2: proposal executed = **false**, certificate **Issued**.
- After approval 2 of 2: proposal executed = **true** (auto-executed), certificate **Revoked**.

## Pre-mainnet guards (verified by simulation, rejected before submission)

- `init called again by another account`
- `set_threshold(4) with only 3 sub-admins`
- `set_threshold(0)`
