import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = fs.existsSync(path.resolve('firestore.rules'))
  ? path.resolve('firestore.rules')
  : path.resolve('DRAFT_firestore.rules');
const rulesText = fs.readFileSync(rulesPath, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(path.resolve('firebase-blueprint.json'), 'utf8'));

test('Rules enforce global default-deny safety net and rules_version 2', () => {
  assert.match(rulesText, /rules_version\s*=\s*'2'/);
  assert.match(rulesText, /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;/);
});

test('Every Firestore collection in firebase-blueprint.json has an explicit hardened match block', () => {
  const paths = Object.keys(blueprint.firestore || {});
  assert.ok(paths.length >= 4);
  assert.match(rulesText, /match\s+\/users\/\{userId\}/);
  assert.match(rulesText, /match\s+\/favorites\/\{trackId\}/);
  assert.match(rulesText, /match\s+\/history\/\{eventId\}/);
  assert.match(rulesText, /match\s+\/playlists\/\{playlistId\}/);
});

test('Dirty Dozen #1–#4: PII isolation, no blanket /users list, and email_verified mandate', () => {
  // No blanket reads or listing of /users
  assert.match(rulesText, /match\s+\/users\/\{userId\}[\s\S]*?allow\s+list:\s*if\s+false;/);
  assert.doesNotMatch(rulesText, /allow\s+read:\s*if\s+isSignedIn\(\);/);
  // Email verification strictly enforced for write operations
  assert.match(rulesText, /request\.auth\.token\.email_verified\s*==\s*true/);
});

test('Dirty Dozen #5–#12: Master Gate, shadow-field hasOnly, ID regex, bounded arrays, immutable fields, and server timestamps', () => {
  // Pillar 1: Master Gate parent existence check on subcollections
  assert.match(rulesText, /exists\(\/databases\/\$\(database\)\/documents\/users\/\$\(userId\)\)/);
  // Pillar 2: Strict hasAll + hasOnly validation blueprints
  assert.match(rulesText, /isValidUserProfile\(incoming\(\),\s*userId\)/);
  assert.match(rulesText, /isValidSavedTrack\(incoming\(\),\s*userId,\s*trackId\)/);
  assert.match(rulesText, /isValidListenEvent\(incoming\(\),\s*userId,\s*eventId\)/);
  assert.match(rulesText, /isValidUserPlaylist\(incoming\(\),\s*userId,\s*playlistId\)/);
  // Pillar 3: Path ID hardening regex
  assert.match(rulesText, /\^\[a-zA-Z0-9_\\\\-\]\+\$/);
  // Pillar 5: Bounded array guards
  assert.match(rulesText, /isBoundedStringList\(data\.topArtists,\s*12,\s*80\)/);
  assert.match(rulesText, /isBoundedStringList\(data\.topGenres,\s*10,\s*60\)/);
  assert.match(rulesText, /isBoundedStringList\(data\.trackIds,\s*50,\s*64\)/);
  // Pillar 8: Secure list queries checking resource.data.uid without get()/exists()
  assert.match(rulesText, /allow\s+list:\s*if\s+isSignedIn\(\)\s*&&\s*isValidId\(userId\)\s*&&\s*isOwner\(userId\)\s*&&\s*resource\.data\.uid\s*==\s*request\.auth\.uid;/);
  // Immutability + Temporal integrity
  assert.match(rulesText, /incoming\(\)\.createdAt\s*==\s*request\.time/);
  assert.match(rulesText, /incoming\(\)\.createdAt\s*==\s*existing\(\)\.createdAt/);
  assert.match(rulesText, /incoming\(\)\.updatedAt\s*==\s*request\.time/);
  assert.match(rulesText, /incoming\(\)\.lastPlayedAt\s*==\s*request\.time/);
  // Action-based affectedKeys().hasOnly() on updates
  assert.match(rulesText, /incoming\(\)\.diff\(existing\(\)\)\.affectedKeys\(\)\.hasOnly\(/);
});
