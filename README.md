# Tussock Scoring

A shared golf competition scoring app. Set up the course card and the field, let each group enter scores hole by hole from their phones, and follow a live leaderboard.

Live version: https://hatleyowen.github.io/tussock-scoring/ (GitHub Pages + Firebase).

The earlier claude.ai artifact version (https://claude.ai/artifact/RGRfwn14mT4kq9UMLQrkES) is kept as a fallback.

## Who can do what

- **Anyone with the link** can see competitions, leaderboards and scorecards. No sign-in.
- **Players and markers** unlock score entry for one competition by typing its **competition code** on the *Enter scores* tab. They only need to do this once per phone. They can enter scores in that competition and nothing else.
- **Organisers** use *Organiser sign in* (Google) to create competitions, edit the course and field, see codes and delete things. To add an organiser, have them sign in once: the page shows their account ID. Then create a document `admins/<account ID>` in the Firestore console (any field, e.g. `addedAt`).

Scores entered without signal are kept on the phone and sent when it reconnects.

## Formats

- **Stroke play** – net and gross leaderboards
- **Stableford** – 2 points for a net par, one more per stroke under
- **Better-ball Stableford** – pairs; the better points score on each hole counts
- **Team scramble** – net stroke play off a team handicap

### Individual + pairs on the same day

A stroke play or Stableford competition can also run a **pairs competition (better-ball Stableford)** off the same scores. Turn it on under *Field & course*, give both partners the same pair name, and the leaderboard gets an **Individual / Pairs** switch. The pairs game has its own handicap allowance (default 85%). Players without a pair name only appear on the individual board.

## Rules implemented

- **Playing handicap (WHS):** `round(index × slope / 113 + (course rating − par))`, then `× allowance` and rounded. Default allowances: 95% individual, 85% better-ball. Plus handicaps give strokes back from stroke index 18 upwards.
- **Strokes per hole** are allocated by stroke index (SI 1 first; handicaps over 18 get a second stroke).
- **Pickups:** 0 points in Stableford, NR (no return) in stroke play.
- **Countback** on completed cards: last 9, 6, 3, then 1 hole. In net stroke play this uses ½, ⅓, ⅙ and 1/18 of the handicap.

## How it's built

Plain HTML, CSS and JavaScript with no build step, served by GitHub Pages:

- `index.html`: the whole app. Firebase is loaded from Google's CDN.
- `firebase-config.js`: the Firebase web app settings (not secret).
- `firestore.rules`: the database access rules. Paste them into Firestore → Rules in the Firebase console and publish after any change.
- `scripts/import-artifact-export.mjs`: one-off import of the old artifact data (see the comments at the top).

Data lives in Cloud Firestore (project `tussock-scoring`, Sydney region):

- `comps/{compId}`: competition settings, course card (`pars`, `si`, `rating`, `slope`) and the optional pairs game (`teams: {enabled, allowance}`)
- `comps/{compId}/players/{entryId}`: entry name, handicap index, NZ Golf member number (`golfNo`, optional), pair/team, and `scores` as a map of hole number to strokes (or `"P"` for a pickup). Scores are saved one hole at a time, so markers on different phones don't overwrite each other.
- `comps/{compId}/members/{uid}`: phones that entered the competition code
- `secrets/{compId}`: `{code}`, the competition code. Only organisers can read it.
- `admins/{uid}`: the organiser list

To test locally, serve the folder over `http://localhost` (for example `npx serve .`). Opening `index.html` straight from disk won't work because the page uses JavaScript modules.

Never commit a Firebase service account key; `.gitignore` excludes the usual file names.
