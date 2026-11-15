# Tussock Scoring

A shared golf competition scoring app. Set up the course card and the field, let each group enter scores hole by hole from their phones, and follow a live leaderboard.

Live version: https://claude.ai/artifact/RGRfwn14mT4kq9UMLQrkES (shared through the page's Share menu; players need Contributor access to enter scores).

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

A single file, `tussock-scoring.html`: plain HTML, CSS and JavaScript, with no build step.

Shared data uses the claude.ai Artifact runtime (`claude.use("db")` and `claude.use("user")`):

- `comps/{compId}`: competition settings, course card (`pars`, `si`, `rating`, `slope`) and the optional pairs game (`teams: {enabled, allowance}`)
- `comps/{compId}/players/{entryId}`: entry name, handicap index, pair/team, and `scores` as a map of hole number to strokes (or `"P"` for a pickup)

If you open the file directly in a browser, there's no database, so only the in-memory sample round works. To run it standalone you'd swap the `db` calls for another backend (for example Firebase, Supabase or a small API).
