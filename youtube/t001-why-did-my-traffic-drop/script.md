# Why did my organic traffic drop? Find the cause in Search Console (4 checks)

Tutorial 1 · publish Thursday 22 October 2026 · about 8 minutes
Source of every claim: https://useflowra.com/blog/why-did-my-traffic-drop (which cites Google's own guide to debugging drops in Search traffic). Product claims: facts/flowra.md.

## Title (pick one)

1. Why Did My Organic Traffic Drop? Find the Cause in 4 Checks (recommended: matches the search and the article)
2. Traffic Dropped? Check These 4 Things in Search Console First
3. How to Diagnose an Organic Traffic Drop (Step by Step)

## Thumbnail

Left: a Search Console style clicks line falling off a cliff, in red. Right: Floey with a magnifying glass, looking worried. Text, 3 words max: "WHY IT DROPPED". White ground, the site's orange for the text accent. No fake numbers on the chart.

## Description

Traffic dropped and you don't know why? Don't start rewriting pages yet. Check these four things in Google Search Console first, in this order. Each one rules a cause in or out, and the pattern you find tells you whether your rankings fell or only your clicks did.

Full written guide, with every report and filter: https://useflowra.com/blog/why-did-my-traffic-drop?utm_source=youtube&utm_medium=video&utm_campaign=t001

Chapters
0:00 Your traffic dropped. Don't panic yet
0:35 Check 1: is the drop real, or a tracking problem?
2:05 Check 2: seasonality or a real drop?
3:20 Check 3: find where the drop lives
4:50 Check 4: did rankings drop, or only clicks?
5:50 Path A: rankings dropped (updates, manual actions, technical faults)
6:55 Path B: rankings held but clicks fell (AI Overviews and SERP changes)
7:35 Doing this every month without the spreadsheet

Flowra connects Search Console, GA4 and WordPress, finds the pages losing traffic and helps you fix them. Free to start: https://useflowra.com?utm_source=youtube&utm_medium=video&utm_campaign=t001

## Tags

organic traffic drop, why did my traffic drop, google search console tutorial, seo traffic drop, traffic drop diagnosis, google update traffic drop, search console compare dates, content decay

## Pinned comment

Which check found your cause? If it was Path B (rankings steady, clicks down), say which query, and we'll look at it in a future video. Written guide: https://useflowra.com/blog/why-did-my-traffic-drop

---

## Script

Voice: Floey, steady pace (the product film's voice). Screens: animated Search Console and GA4 mockups in the film's style, built on the demo site's data and labelled "Example data". Never a real customer's numbers. Text in [brackets] is what the screen shows.

### 0:00 · Hook (0:35)

[Floey hovers over a clicks line that falls off a cliff.]

Your organic traffic just dropped. Before you rewrite a single page, stop.

A drop has one of a short list of causes: a tracking glitch, seasonal demand, a Google update, a technical fault, a manual action, or a change in the search results that takes clicks even though you still rank.

[The six causes appear as page-flowers, each with a label.]

Google's own guide to debugging traffic drops names the same group. What it doesn't give you is the order to check them in. That's what this video is. Four checks, then two paths.

### 0:35 · Check 1: is the drop real? (1:30)

[Search Console: Performance > Search results. Date filter > Compare > last 28 days vs previous 28 days.]

First, rule out your own reporting. A broken tag can wipe out half your "organic traffic" overnight without a single visitor going missing.

In Search Console, open Performance, then Search results. Click the date filter, choose Compare, and set the last 28 days against the previous 28 days. Note the change in clicks.

[GA4: Reports > Acquisition > Traffic acquisition, same dates, the Organic Search row highlighted.]

Now do the same in GA4: Reports, Acquisition, Traffic acquisition, same dates, and find the Organic Search row.

[A three-row decision card.]

If both fell by a similar share, the drop is real. If GA4 fell but Search Console didn't, people are still arriving from Google and GA4 just isn't counting them. Check the tag, the consent banner and your GA4 settings. And if Direct, Referral and Organic all fell in GA4 on the same day, it's almost always the tag, not Google.

The two tools never match exactly. That's normal. What matters is whether the gap between them changed.

### 2:05 · Check 2: seasonality or a real drop? (1:15)

[Search Console date set to Last 16 months, clicks and impressions on, last year's dip circled.]

Demand moves. People search for garden furniture in spring and tax deadlines a few weeks a year.

Set Search Console to the last 16 months, turn on clicks and impressions, and look for the same dip at the same time last year. Then compare the last 3 months against the same 3 months last year. Google's guide suggests exactly these comparisons.

[Impressions line falls, position line stays flat.]

The signal for falling demand is specific: impressions drop while average position holds. You show up in the same place for the same searches, but fewer people are searching. No on-page fix brings that back.

### 3:20 · Check 3: find where the drop lives (1:30)

[Pages tab, sorted by click difference; then filters: Query regex, Page contains /blog/, Devices, Countries.]

A site-wide number hides the cause, so split it before you form a theory.

Keep the date comparison on and open the Pages tab, sorted by click difference. If a few URLs carry most of the loss, suspect a technical fault, redirects, lost links or a competitor on those pages.

Split branded from non-branded with a Query filter, Custom regex, using your brand names and misspellings. Branded down is a marketing problem. Non-branded down points at rankings or the search results.

Then check folders, devices and countries. A drop in one section points at a template or a redirect rule. Mobile only points at the mobile layout. One country points at a local competitor or hreflang.

[Export > Google Sheets, a change column added.]

Export the Pages tab for both periods and add a change column. Often a handful of URLs account for most of the loss, and your investigation just went from a whole site to five pages.

### 4:50 · Check 4: rankings, or only clicks? (1:00)

[A four-column card: clicks, impressions, CTR, position.]

Now read clicks, impressions, CTR and average position together for the part of the site that lost traffic.

Position steady, impressions down: less demand. Back to check 2. Position down with impressions: your rankings fell. That's Path A. Position and impressions steady, CTR down: the search results changed. That's Path B.

One caution: average position is weighted by impressions, so confirm the pattern per query and per page, not just the site total.

### 5:50 · Path A: your rankings dropped (1:05)

[Google Search Status Dashboard with a rollout window; Security & Manual Actions; Indexing > Pages.]

Open the Google Search Status Dashboard. If your drop starts inside an update's rollout window and spreads across many pages, there's usually nothing technical to fix. Compare your losing pages with what now ranks above them and improve them honestly.

Then open Security and Manual Actions in Search Console and check both reports. And if some pages fell to near zero impressions, check Indexing, Pages, and inspect those URLs.

Size matters too. Google's guide separates a small move, like position 2 to 4, from a large one, like falling out of the top 10 to around 29. Watch small moves for a few weeks before you rebuild anything.

### 6:55 · Path B: rankings held, clicks fell (0:40)

[A results page where an AI Overview pushes the listing down.]

If your position and impressions held but CTR fell, the results page changed around you. An AI Overview or another feature now answers the query above your listing. Search your top queries yourself and look at what sits above you. The fix is to be the page worth clicking, or the source the answer cites.

### 7:35 · Close (0:30)

[The four checks as a single checklist card; then Flowra's analytics screen from the demo site, labelled Example data.]

Four checks: is it real, is it seasonal, where does it live, and is it rankings or clicks. Run them in that order every time.

If you'd rather not rebuild this spreadsheet every month, Flowra joins Search Console and GA4 page by page and flags the pages losing traffic, with the reason. It's free to start. The written guide with every report is linked below.

[End screen: subscribe, and the next tutorial.]
