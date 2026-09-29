# What Flowra is and does (the only source for claims about Flowra)

Checked against the app code on 2026-09-25 (`src/lib/planConfig.ts` and the
feature code). If a sentence about Flowra is not supported by this file, it
does not go in an article. When the app changes, update this file first.

## In one line

Flowra connects to a site's Google Search Console, GA4 and WordPress, finds
the pages losing traffic or close to page one, and helps a content team fix
them, write new pages outline first, publish to WordPress and measure whether
the change worked.

Website: https://useflowra.com. Sign up: https://app.useflowra.com/signup (there is a
Free plan). Articles use the exact signup link their brief gives, with its
tracking parameters.

## Plans (monthly price, USD)

| Plan | Price | Sites | Seats | Article credits a month |
|---|---|---|---|---|
| Free | $0 | 1 | 1 | about 3 standard articles (420 credits) |
| Starter | $49 | 3 | 5 | about 15 standard articles (2,100 credits) |
| Pro | $129 | 10 | 15 | about 40 standard articles (5,600 credits) |
| Agency | $299 | unlimited | unlimited | about 100 standard articles (14,000 credits) |

Extra sites can be added as packs (+1 for $10, +5 for $39, +10 for $69).

## What each plan unlocks

- **Free:** content creation and editing, WordPress publishing, the Content
  Repository, Task Board, Content Workflow Board, and basic Search Console
  reports (a content decay report and the top 5 striking distance queries).
- **Starter adds:** SERP research, outline generation, AI content creation, the
  AI SEO analyzer, the full Search Console and GA4 analytics dashboard, and team
  collaboration.
- **Pro adds:** the AI Insights panel, the Rework Queue (rewriting pages that
  lost traffic), ranking detection, task assignments, blog rework, the Index
  Coverage Monitor, performance insights, AI image generation, and keyword
  cannibalization reports.
- **Agency adds:** priority processing, workflow automation, advanced
  workflows and custom AI prompts.

## Features you may describe (and their limits)

- **Content decay:** finds pages whose clicks and impressions are falling,
  from Search Console data, and puts them in a queue to fix.
- **Striking distance:** queries where a page ranks roughly positions 8 to 20.
  Free shows the top 5; the full report is part of analytics.
- **Analytics:** Search Console and GA4 in one dashboard, filters, 16 months
  of history, queries, pages, countries, devices, new rankings.
- **AI traffic tracking:** visits referred by ChatGPT, Perplexity and other
  AI assistants, read from GA4 referrers. It measures visits
  that arrive; it cannot see answers that did not send a click.
- **Featured snippet opportunities:** question queries where a page already
  ranks near the top and could win the snippet.
- **Index Coverage Monitor (Pro):** checks whether pages are indexed in Google
  and records when that changes.
- **Recrawl on publish:** when Flowra publishes to WordPress it asks Google to
  recrawl the URL. It never guarantees reindexing; do not claim it does.
- **Writer:** outline first. You approve or edit the outline, then Flowra
  writes the article in the site's own writing style, with SERP research on
  Starter and above. It publishes to WordPress.
- **Rework Queue (Pro):** rewrites the sections of an existing page that need
  it, keeping what already works, and shows the changes before publishing.
- **Measure a change:** tag a change on a page and Flowra compares the period
  before and after, with a 14 day settling window and an adjustment for the
  whole site's movement. It is a before-and-after comparison, not an A/B or
  split test. Never call it split testing.
- **Client reports:** a report per site that rebuilds itself every week; the
  app shows when it is ready. It can be shared with a client as a link that
  always shows the current report, with the agency's name, logo and colour
  (Starter and above). On Starter and Pro a small "Report made with Flowra"
  line stays at the bottom; only the Agency plan removes it, making the
  report fully white-label. Nothing emails reports to clients, and do not
  claim weekly emails.
- **Task Board and Content Workflow Board:** on every plan, including Free.
- **WordPress only for some features:** rework, the Content Repository and
  index coverage need a WordPress site today. Analytics works for any site in
  Search Console.

## Things Flowra does not do (never imply them)

- No rank tracker with its own SERP scraping; positions come from Search
  Console.
- No backlink data, no site-audit crawler, no keyword volume database.
- No split testing, no guaranteed indexing, no scheduled emails to clients.
- No integrations beyond Google Search Console, GA4 and WordPress.

## Proof points you may use

- Flowra's own blog is written and published with this system, following the
  cluster plan on useflowra.com.
- First-hand finding (2026-09): GPTBot was blocked by the web host at the
  edge (HTTP 429 for `GPTBot/1*`) even though robots.txt allowed it, while
  other AI crawlers passed. Only for the AI crawler articles.

Never invent customers, testimonials, percentages, time saved or results.
