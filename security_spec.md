# Melophile Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict Owner Isolation (PII Protection)**: `/users/{userId}` contains `email` and `photoURL`. Only `request.auth.uid == userId` with `request.auth.token.email_verified == true` may read or mutate their profile. Blanket reads or listing `/users` are strictly forbidden.
2. **Master Gate Relational Sync**: Every document in `/users/{userId}/favorites/{trackId}`, `/users/{userId}/history/{eventId}`, and `/users/{userId}/playlists/{playlistId}` requires the parent `/users/{userId}` document to exist via `exists()` on mutations and requires `incoming().uid == request.auth.uid` and `userId == request.auth.uid`.
3. **Strict Path ID & Payload Bounds**: Every document ID path variable must satisfy `isValidId()` (`<= 128` chars, `^[a-zA-Z0-9_\-]+$`). Every string and array field must enforce explicit `.size()` boundaries matching `firebase-blueprint.json`.
4. **Anti-Update-Gap & Named Actions**: Every `update` block must begin with `isValid[Entity](incoming())`, enforce immutable `uid` and `createdAt`, enforce `updatedAt == request.time` (or `lastPlayedAt == request.time`), and restrict changed keys using `incoming().diff(existing()).affectedKeys().hasOnly([...])`.
5. **Temporal Integrity**: `createdAt`, `updatedAt`, and `lastPlayedAt` must match `request.time` via `serverTimestamp()`; client-forged timestamps are rejected.
6. **Secure List Queries**: Every `allow list` on subcollections explicitly validates `resource.data.uid == request.auth.uid` without calling `get()` or `exists()`.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Fail with PERMISSION_DENIED)
1. **Unauthenticated Profile Read**: `GET /users/userA` with `auth = null`.
2. **Cross-User PII Leak**: `GET /users/userA` authenticated as `userB`.
3. **Blanket Users List Scrape**: `LIST /users` authenticated as `userA`.
4. **Unverified Email Spoof Write**: `CREATE /users/userA` with `auth.uid = 'userA'` and `auth.token.email_verified = false`.
5. **Identity Spoofing on Subcollection**: `CREATE /users/userA/favorites/track1` with `uid: "userB"` while authenticated as `userA`.
6. **Shadow / Ghost Field Injection**: `CREATE /users/userA` with extra field `isAdmin: true` or `role: "superadmin"`.
7. **Orphaned Subcollection Write**: `CREATE /users/userA/favorites/track1` when `/users/userA` does not exist.
8. **ID Poisoning Attack**: `CREATE /users/userA/favorites/../../../admin$hack` (invalid characters / > 128 bytes).
9. **Denial-of-Wallet Oversized Array**: `UPDATE /users/userA` with `topArtists` containing 50 items (> 12 limit).
10. **Value Poisoning on Allowed Update Field**: `UPDATE /users/userA` changing `displayName` to a 500-char string or boolean `true`.
11. **Immutable Field Tampering**: `UPDATE /users/userA/history/track1` attempting to alter `createdAt` or `uid`.
12. **Client-Forged Timestamp**: `CREATE /users/userA/favorites/track1` with a past client timestamp instead of `request.time`.
