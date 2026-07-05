# Policy and privacy constraints

Last reviewed: 5 July 2026.

This document records engineering constraints, not legal advice.

## Temporary public-page collector

YouTube's Terms of Service restrict automated access to the service through robots, botnets, or scrapers except for specified search-engine access, prior written permission, or access otherwise permitted by applicable law. The same terms also restrict collecting identifying information unless permitted.

Official source:

- https://www.youtube.com/static?template=terms

The temporary Playwright provider is therefore an at-risk local prototype, not the preferred production integration. It must be isolated, clearly labelled, conservative, and replaceable. It must never bypass technical controls or conceal automation.

## Intended long-term integration

The supported long-term route is the YouTube Data API. The API provides comment and comment-thread resources, including pagination and structured identifiers/timestamps subject to the API's authorisation and policy rules.

Official sources:

- https://developers.google.com/youtube/v3/docs/comments
- https://developers.google.com/youtube/v3/docs/commentThreads/list
- https://developers.google.com/youtube/terms/developer-policies

The future API implementation requires a separate policy review before enabling automated public scoring or persistent leaderboard features.

## Source-data principles

- Collect only what is necessary for the operator's stated quiz workflow.
- Preserve source evidence without claiming unavailable facts.
- Do not commit source data to GitHub.
- Do not expose raw data over the network.
- Avoid storing full page HTML.
- Redact source data from logs.
- Provide collection deletion and player-data purge operations.
- Support configurable retention.
- Separate source snapshots from operator overrides.

## Personal data

Author handles, channel URLs/IDs, comments, timestamps, and scores can relate to identifiable people. Runtime data must be treated as personal data even when it was publicly visible on YouTube.

For local prototyping:

- store data only on the operator's device;
- document the data inventory;
- minimise retention;
- do not publish a leaderboard without a separate privacy and rules review;
- provide deletion and opt-out workflows before public use;
- do not place email addresses, account credentials, or browser cookies in the database unless a later approved feature strictly requires them.

## Browser provider prohibited techniques

The implementation must not include:

- automated Google login;
- password handling;
- cookie theft or session import from another browser;
- CAPTCHA solving;
- stealth automation plugins;
- proxy rotation;
- user-agent or fingerprint spoofing intended to evade detection;
- parallel farms or distributed collection;
- circumventing age, account, geographical, or other access restrictions;
- posting, editing, deleting, liking, pinning, hearting, or replying to comments.

## Operational warning

The UI must display a clear warning before running the temporary provider:

> This temporary browser collector is an experimental local tool. Automated access may conflict with YouTube's Terms of Service. It does not bypass access controls and may stop when YouTube presents a challenge or changes the page. The official YouTube Data API is the intended long-term integration.

## Public game boundary

The MVP is an internal operator tool. It should calculate local provisional scores, but it must not present itself as an officially approved YouTube integration. Before public prizes, automatic API-based comment scoring, or a hosted leaderboard are introduced, perform a new review of:

- YouTube contest policies;
- fake-engagement policy;
- YouTube API developer policies;
- the exact approved API use case;
- GDPR transparency, legal basis, retention, deletion, and objection rights;
- official game rules.
