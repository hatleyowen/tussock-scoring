// One-off import of the claude.ai artifact data into Firestore.
//
// Usage (from the scripts folder):
//   npm install
//   node import-artifact-export.mjs <export-dir> <service-account-key.json> [--admin <uid>] [--dry-run]
//
// <export-dir> holds comps/<compId>.json and comps/<compId>/players/<playerId>.json, as written by
// the artifact export. Document ids are kept, so links like #c-<compId> keep working.
// Each competition's join code is moved out of the public competition document into secrets/<compId>.
// --admin <uid> also adds that Firebase user id to the organiser list (admins/<uid>).
// Keep the key file outside the repo and delete it when you're done.

import {readFile, readdir, stat} from "node:fs/promises";
import path from "node:path";
import {initializeApp, cert} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const adminIdx = args.indexOf("--admin");
const adminUid = adminIdx >= 0 ? args[adminIdx + 1] : null;
const [exportDir, keyFile] = args.filter((a, i) => !a.startsWith("--") && (adminIdx < 0 || i !== adminIdx + 1));

if (!exportDir || !keyFile) {
  console.error("Usage: node import-artifact-export.mjs <export-dir> <service-account-key.json> [--admin <uid>] [--dry-run]");
  process.exit(1);
}

const readJson = async f => JSON.parse(await readFile(f, "utf8"));
const isDir = async p => { try { return (await stat(p)).isDirectory(); } catch { return false; } };

const key = await readJson(keyFile);
initializeApp({credential: cert(key)});
const db = getFirestore();

const compsDir = path.join(exportDir, "comps");
const writes = [];

for (const file of (await readdir(compsDir)).filter(f => f.endsWith(".json"))) {
  const compId = path.basename(file, ".json");
  const comp = await readJson(path.join(compsDir, file));
  const {code, ...pub} = comp;
  writes.push({path: `comps/${compId}`, data: pub});
  if (code) writes.push({path: `secrets/${compId}`, data: {code: String(code).toUpperCase()}});

  const playersDir = path.join(compsDir, compId, "players");
  if (await isDir(playersDir)) {
    for (const pf of (await readdir(playersDir)).filter(f => f.endsWith(".json"))) {
      const pid = path.basename(pf, ".json");
      const p = await readJson(path.join(playersDir, pf));
      writes.push({path: `comps/${compId}/players/${pid}`, data: {scores: {}, ...p}});
    }
  }
  console.log(`${comp.name} (${compId}): code ${code || "none"}`);
}
if (adminUid) writes.push({path: `admins/${adminUid}`, data: {addedAt: new Date().toISOString()}});

console.log(`\n${writes.length} documents to write${dryRun ? " (dry run, nothing written)" : ""}:`);
for (const w of writes) console.log("  " + w.path);
if (dryRun) process.exit(0);

// Firestore batches hold up to 500 writes.
for (let i = 0; i < writes.length; i += 450) {
  const batch = db.batch();
  for (const w of writes.slice(i, i + 450)) batch.set(db.doc(w.path), w.data);
  await batch.commit();
}
console.log("\nDone.");
