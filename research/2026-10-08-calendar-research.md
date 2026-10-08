# Social and YouTube calendar: research and decisions (8 October 2026)

Asked for: a content calendar across Instagram, Facebook, LinkedIn and YouTube, researched to give each post the best chance of spreading, and changes to the existing calendar only where the research says so. X is paused (founder, 8 Oct).

## Where we are (our own numbers, Instagram insights, 8 Oct 03:30 UTC)

| Reel | Posted | Views | Reach | Likes | Saves | Shares | Comments |
|---|---|---|---|---|---|---|---|
| r002 Find the pages losing traffic | 6 Oct 20:41 IST | 86 | 75 | 2 | 0 | 0 | 0 |
| r003 Day 3 is too soon | 7 Oct 20:02 IST | 11 | 11 | 0 | 0 | 0 | 0 |
| r004 Was it the spam update? | 8 Oct 02:56 IST (timing bug) | 2 | 2 | 1 | 0 | 0 | 0 |

Facebook insights came back with a metric error; fixed in meta-check for next time. YouTube Shorts: r002 and r003 are up (8 Oct), no data yet.

Honest reading: a brand-new account, three posts, zero shares and zero saves. Nothing has been given the chance to spread yet, and nothing here guarantees it will. What the research below says is which levers move distribution to people who do not follow us, and the calendar is rebuilt around those levers.

## What the platforms reward now (sources at the end)

**Instagram Reels.** Adam Mosseri named three ranking signals in January 2025: watch time, likes per reach, and sends per reach (DM shares). Instagram's own reach guidance: reels must be under 3 minutes to be recommended; most advice puts discovery reels at 15 to 60 seconds. Saves and sends are treated as the "silent" signals: a post with many saves out-reaches one with many likes. Our reels run 35 to 38 seconds, inside the range; all three have zero sends. Trial Reels (shown only to non-followers first) are the cheapest hook test, but the Graph API we post through does not expose them; they are only available in the app or via paid third-party APIs.

**YouTube Shorts.** The feed is explore-then-exploit (Todd Sherman, Shorts product lead, on Creator Insider): a seed audience first, then wider if the "viewed vs swiped away" ratio and completion hold. 2026 benchmarks from retention datasets: 22 to 45 seconds is the sweet spot for explainers, 70%+ viewed-vs-swiped is viral territory, and sub-15-second Shorts underperform because they cannot accumulate watch time. Comments weigh most, then shares and saves. Consistency beats volume: 3 to 5 a week. Our 3 reels a week at 35 seconds fit; no change.

**LinkedIn.** Richard van der Blom's Algorithm Insights 2026 (1.3M posts): reach down about 50% over two years, dwell time is the main currency (posts held over 61 seconds get a 15.6% engagement rate, under 3 seconds get 1.2%), and the top formats are document carousels (PDF), then native vertical video of 30 to 90 seconds. AuthoredUp 2026: documents at about 6.6% engagement, roughly 6x a text post's engagement and 4x its reach, best at 8 to 10 slides with under 12 words a slide. Links in the body cut reach 40 to 60%; the first comment is the place. Company pages get a small fraction of feed distribution compared with personal profiles. Timing for a mixed US/EU/India audience: Tuesday to Thursday mornings in the reader's timezone. Our calendar had text posts only, Tuesday and Thursday, with no document posts.

**Facebook.** Every video is a Reel now, and Reels is the strongest organic reach driver for Pages. Since March 2026 Meta deprioritises unoriginal content and can stop recommending accounts that repost; our reels are original, so nothing changes.

**Timing.** B2B data across platforms: Tuesday to Thursday, 3 posts a week, is the best cadence per post. Instagram: 06:00 to 09:00 and 20:00 are the engagement peaks (Metricool 2026). YouTube Shorts for tech and B2B: Tuesday to Thursday, 12:00 to 14:00 Eastern. LinkedIn: Tuesday and Wednesday, 08:00 to 11:00 in the audience's zone. Our autopost fired at 10:00 IST, which is 00:30 in New York.

## What people are talking about this week

From our Reddit, Hacker News and YouTube listening (7 Oct) plus the news check (8 Oct):

- Google's September 2026 spam update started 24 September and the Search Status Dashboard still shows it ongoing on 8 October; the other three spam updates of 2026 took 19 hours, 2 days and under 3 days. Every traffic-drop thread blames it.
- AI Overviews on branded searches went from about 26% to 82% of tracked queries in September (DemandSphere, daily tracking) and 82.9% of 92.5M US desktop branded crawls on 29 September (Ahrefs). Agencies are asking how to explain this to clients.
- Search Console's generative AI performance report (AI Overviews and AI Mode impressions, pages, countries, devices) went global on 31 August 2026. Almost none of the "am I getting AI traffic" threads mention it: it is new, useful and under-explained, which is the best kind of tutorial topic.
- Google is paying about 100 publishers 0.1% of ad revenue in an AI Contribution pilot, shown as a Search Console widget.
- Evergreen pain that keeps coming back: what to do with old posts (55-comment thread), recovering after publishing lots of AI posts (122 comments), explaining AI Overview drops to clients (39 comments).

## Decisions (what changed, and what did not)

1. **Post in the evening IST, not the morning.** Autopost now posts at the 19:00 IST run (09:30 New York, 14:30 London, India's 20:00 peak minutes later), with 22:00 as the fallback. Code: `src/autopost.ts`, window 18:00 to 23:00 IST.
2. **LinkedIn Thursdays become document posts (PDF carousels), 6 to 9 slides, under 26 words a slide, in the site's look, with Floey on the last slide.** Tuesdays stay text. Built in `src/carousel.ts`; the drafter asks for slides and renders the PDF next to the post. Links stay in the first comment. One post a day at most. The founder posting or reposting from a personal profile would reach far more than the page can; that is a recommendation, not something the calendar can do.
3. **This week's reels take the news hooks** (Search Console's AI report; AI Overviews on 8 in 10 branded searches; the spam update that will not end), each with a "send this to a colleague" angle, because sends are the signal we are at zero on. Added to `research/latest.json` (what the reel maker reads) and `calendar/topics.json` (the persistent backlog). The evergreen listening ideas stay behind them.
4. **YouTube Tutorial 2 becomes the Search Console AI performance report** (review 2 Nov, publish 5 Nov); content pruning moves to Tutorial 3 (review 16 Nov, publish 19 Nov). The AI report is new and nearly uncovered on YouTube; pruning is evergreen and can wait two weeks. Shorts cadence (3 a week) and tutorial cadence (one every two weeks) are unchanged; they match the research.
5. **Unchanged on purpose:** reel length (35 seconds, inside every range found), three reels a week, Facebook (original content already), the LinkedIn Tuesday text post, hashtags (0 to 3).
6. **Not possible from here:** Instagram Trial Reels (no Graph API support). If the founder wants to test hooks, it is a manual toggle in the app when posting.

## The next four weeks (what Desk shows)

| Week | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 6 to 10 Oct | r002 reel (done) | r003 reel (done), LinkedIn first post (done) | r004 reel (done), LinkedIn content pruning (done) | r003 and r002 Shorts (done), launch film 19:30 IST once advanced features are approved | Reel: Search Console's AI report |
| 13 to 17 Oct | Reel: 8 in 10 branded searches get an AI answer | LinkedIn text: three-step client script for AI Overview drops | Reel: the spam update that will not end | LinkedIn carousel: refresh old posts, map queries first | Reel: old blog posts, prune or refresh (listening #1) |
| 20 to 24 Oct | Reel: rewriting beats keyword tweaks (listening #2) | LinkedIn text: Google paying publishers for AI citations | Reel (listening or backlog) | LinkedIn carousel (listening or next article), Tutorial 1 publishes 22 Oct 19:30 IST | Reel |
| 27 to 31 Oct | Reel | LinkedIn text | Reel | LinkedIn carousel | Reel |
| 2 to 6 Nov | Reel, Tutorial 2 review (2 Nov) | LinkedIn text | Reel | LinkedIn carousel, Tutorial 2 publishes 5 Nov | Reel |

Every reel also goes to YouTube Shorts (by hand, pack in `Social Reels (published)/<id>/youtube-short.txt`) and has a LinkedIn and X text in its pack. Reels post at 19:00 IST. LinkedIn posts: 09:00 to 11:00 in the reader's morning, which for a US-leaning audience is 18:30 to 20:30 IST; for a UK-leaning one, 13:30 to 15:30 IST.

## What to watch, and when to change course

- Instagram: sends and saves per reel, not views. The first reel to pass 5 sends is the format to repeat.
- YouTube Shorts: "viewed vs swiped away" in Studio; under 50% means the first frame is losing people.
- LinkedIn: dwell (read time) on documents vs text, from the page's post analytics, after four Thursdays.
- Reply to every comment within the first hour on every platform; the research is unanimous that early replies decide reach, and we have had none to reply to yet.
- Review on 5 November with the first month of YouTube data and four weeks of carousels. Keep what earned sends or dwell; drop what did not.

## Sources

Instagram: Mosseri's three signals via [dataslayer](https://www.dataslayer.ai/blog/instagram-algorithm-2025-complete-guide-for-marketers), [highstyle](https://www.highstyle.ai/insights/instagram-reels-algorithm-2026), [postplanify](https://postplanify.com/blog/instagram-reels-algorithm); Trial Reels and API: [Instagram content publishing docs](https://developers.facebook.com/docs/instagram-platform/content-publishing), [Ayrshare](https://www.ayrshare.com/docs/apis/post/social-networks/instagram.md).
YouTube Shorts: [vidIQ on the Creator Insider interview](https://vidiq.com/blog/post/youtube-shorts-algorithm/), [OpusClip retention data](https://www.opus.pro/blog/ideal-youtube-shorts-length-format-retention), [socialync](https://www.socialync.io/blog/youtube-shorts-algorithm-2026), [reelrise on viewed vs swiped](https://reelrise.app/guide/viewed-vs-swiped-away-the-only-youtube-shorts-metric-that-matters/).
LinkedIn: [van der Blom 2026 report, Creator Science](https://podcast.creatorscience.com/richard-van-der-blom-2/), [meet-lea dwell data](https://meet-lea.com/en/blog/linkedin-algorithm-explained), [dataslayer](https://www.dataslayer.ai/blog/linkedin-algorithm-february-2026-whats-working-now), [conbersa formats](https://www.conbersa.ai/learn/linkedin-content-formats-highest-reach-2026), vendored playbook `brand/linkedin-skills/algorithm-heuristics.md`.
Facebook: [Social Media Examiner, 2026 rules for reach](https://www.socialmediaexaminer.com/facebooks-2026-rules-for-reach-relevance/), [Fanpage Karma](https://www.fanpagekarma.com/insights/the-facebook-algorithm-2026-explained-what-marketers-need-to-know/).
Timing: [Metricool 2026](https://metricool.com/best-time-to-post-social-networks/), [traxy B2B LinkedIn](https://traxy.ai/blog/best-time-to-post-on-linkedin-b2b-data-guide-2026), [flowshorts, 24K Shorts](https://flowshorts.app/blog/best-time-to-post-youtube-shorts), [iqfluence](https://iqfluence.io/public/blog/best-times-to-post-on-social-media).
News: [Google: generative AI performance reports](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports), [Search Console help](https://support.google.com/webmasters/answer/16984139?hl=en), [SEJ global rollout](https://www.searchenginejournal.com/google-search-console-ai-reports-rolled-out-worldwide/587836/), [DemandSphere branded AIO](https://www.demandsphere.com/blog/branded-ai-overviews-september-2026/), [Ahrefs branded AIO](https://ahrefs.com/blog/ai-overviews-on-branded-searches/), [Search Status Dashboard](https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history), [SER October webmaster report](https://www.seroundtable.com/october-2026-google-webmaster-report-42185.html), [SER spam update phase 3](https://seroundtable.com/google-september-2026-spam-update-phase-3-42239.html).
Listening: `research/2026-10-07/ideas.md` (Reddit r/SEO, r/TechSEO, HN, YouTube, last 30 days).
