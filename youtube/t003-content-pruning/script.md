# Content pruning: what to update, merge, redirect or delete

Tutorial 3 · review Mon 16 November, publish Thu 19 November 2026 · about 6 to 7 minutes · first narrator-led tutorial
Sources of every claim (checked 4 Nov 2026): Google on status codes https://developers.google.com/search/docs/crawling-indexing/http-network-errors, on noindex https://developers.google.com/search/docs/crawling-indexing/block-indexing, on keeping redirects https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes, and on redirects https://developers.google.com/search/docs/crawling-indexing/301-redirects. Method and batch sizes: https://useflowra.com/blog/content-pruning. Product claims: flowra-outreach facts/flowra.md.

## Format (new from this video)

One narrator (Sudhan's cloned voice, first person), no Floey voice and no characters. Result first, then the steps, one chapter every 60 to 90 seconds, a zoom or cut every 5 to 10 seconds, captions only for key numbers and rule names. Flowra appears only in the last 40 seconds. Screens: Flowra from the Demo site; Search Console and the sheet drawn in code. All labelled "Example data". Tick YouTube's altered or synthetic content box on upload.

## Title (pick one)

1. Content Pruning: What to Update, Merge, Redirect or Delete (recommended: the search phrase)
2. How to Do Content Pruning Without Losing Traffic
3. Should You Delete Old Blog Posts? A 5-Question Test

## Thumbnail

Left: a sheet with four rows, each with a coloured label: UPDATE, MERGE, REDIRECT, DELETE. Text, 3 words max: "DELETE THIS PAGE?" White ground, the site's orange for the accent. No face, no real numbers.

## Description

Should you delete that old blog post? Usually not. This video gives you five questions to ask about any page, in order, so each one ends up with a clear action: merge, update, noindex, redirect or delete. You'll also see how to build the list in Search Console, the pages you should never remove, and how to clean up afterwards.

Written guide: https://useflowra.com/blog/content-pruning?utm_source=youtube&utm_medium=video&utm_campaign=t003

Chapters (replace with real times after the voice is built)
0:00 The sheet you'll have by the end
Build your list in Search Console
Six kinds of page to protect
The five questions
Question 1: merge
Question 2: update
Question 3: noindex
Question 4: redirect
Question 5: delete
Do it in small batches
Clean up and measure
Doing this without the spreadsheet

Every number in the video is example data.

Flowra connects Search Console, GA4 and WordPress and finds the pages losing traffic. Free to start: https://useflowra.com?utm_source=youtube&utm_medium=video&utm_campaign=t003

## Tags

content pruning, content pruning seo, delete old blog posts, should i delete old blog posts, content audit, 301 redirect or delete, noindex vs delete, update old blog posts

## Pinned comment

Which page on your site are you least sure about? Tell us what it's about and how much traffic it gets, and we'll say which of the five questions it stops at.

---

## Script

Text in [brackets] is what the screen shows.

### Hook: the result (0:30)

[Cold open on the finished sheet. Twenty page URLs, each with a coloured action: Merge, Update, Noindex, Redirect, Delete. Slow push in. "Example data" badge.]

This is what you'll have by the end of this video. A list of your weakest pages, and next to each one, exactly what to do with it.

Most of them won't say delete. That's the part people get wrong. They hear "content pruning", remove a few hundred old posts, and hope Google rewards them.

[Six rows fade out. One line of text: "Remove only what has no job left."]

So I'll show you how to build this list, the five questions that decide each page, and how to clean up so you don't lose what's already working.

### Build your list (1:05)

[Search Console: Performance, Search results, date filter opens.]

Start in Search Console. Open Performance, then Search results, and open the date filter.

[Compare tab. "Last 3 months" against the same period a year earlier. Caption: "Year on year".]

Pick Compare, and set the last three months against the same three months a year earlier. Comparing with last year matters, because it takes seasons out of the picture. A ski blog always looks bad in July.

[Pages tab. Clicks difference column sorted, biggest losses on top.]

Now click the Pages tab and sort by clicks difference. Your biggest losers come to the top.

[Export menu. Sheet opens. Caption: "1,000 rows".]

Export it. The export gives you up to a thousand rows. If your site is bigger, you'll need the API or the BigQuery export, but for most sites this is plenty.

[Sheet: one empty column added, headed "Action". A second added, "Notes".]

Add two columns: Action and Notes. And keep this first list short. Pick about twenty pages. You're learning the method, not cleaning the whole site in one afternoon.

### Six kinds of page to protect (0:55)

[Six cards appear one at a time, each with a small icon.]

Before you judge anything, take out the pages traffic numbers can't judge fairly. There are six.

Pages that convert. A pricing page or a demo page with ten visits a month might be the most valuable page you have.

Pages that earn links. Other sites point at them, and that helps the rest of your site.

Pages your customers or sales team use, even if nobody finds them through Google.

Seasonal pages, which look dead until their season comes back.

New pages. Anything under about six months old may not have settled yet.

And pages for a small audience that really matters to you.

[Rows greyed out on the sheet. Caption: "Not up for review".]

Low traffic alone is not a reason to remove a page.

### The five questions (0:20)

[A vertical list of five questions, one lit at a time.]

For everything left, ask five questions, in this order, and stop at the first yes. The order matters. It stops you deleting a page that only needed merging.

### Question 1: merge (0:50)

[Caption: "1. Does another page cover the same intent?" Two similar URLs side by side.]

One. Does another of your pages cover the same search intent?

If two posts answer the same question, they compete with each other. Merge them.

[The stronger URL glows. Useful paragraphs slide across from the weaker page. An arrow labelled 301.]

Keep the stronger URL. Move anything useful from the weaker page into it, then 301 redirect the weaker one to it, and point your internal links straight at the page you kept.

Use a redirect here, not a canonical tag. A canonical is a hint that Google can ignore, and it leaves both pages live.

### Question 2: update (0:40)

[Caption: "2. Still relevant and still searched?" A page with outdated sections highlighted.]

Two. Is the topic still relevant to your business, and do people still search for it?

If yes, update it. This is where most of your list should land.

[Edits appear: a date fixed, padding struck out, an internal link added.]

Keep the same URL. Fix what's out of date, answer what people search for today, cut the padding, and add internal links. And only change the visible date if you really changed the page.

### Question 3: noindex (0:40)

[Caption: "3. Needed outside search?" Examples: an old press release, a thank-you page, a thin tag archive.]

Three. Do people need this page, just not from search? A thank-you page. An old press release you have to keep. A thin tag archive.

Noindex it. The page stays up for visitors and leaves the search results.

[A robots.txt file with a line crossed out.]

One trap. Don't also block that page in robots.txt. Google has to be able to crawl the page to see the noindex. Block it, and Google never reads the instruction.

### Question 4: redirect (0:35)

[Caption: "4. Has links, or a better page to land on?" A URL with incoming link arrows.]

Four. Does the page have links from other sites, or is there another page a visitor would be happy to land on instead?

Then 301 it to that page.

[Many URLs pointing at a homepage, crossed out.]

The key word is happy. Sending a hundred unrelated pages to your homepage doesn't help the people who land there. And once a redirect is live, leave it. Google says to keep redirects for at least a year, and longer is better.

### Question 5: delete (0:40)

[Caption: "5. None of the above?" A page fades. Status code card: 404, 410.]

Five. None of the above? No traffic, no links, no conversions, no other job. Now you delete it.

You'll hear that a 410 removes a page faster than a 404. Google's documentation says all 4xx errors, except 429, are treated the same. Either way, the URL drops out of the index. So use whichever your site makes easy.

[The sheet again, every row now carrying an action.]

And those deleted URLs do no harm to the rest of your site. The only real damage comes from deleting a page that had good links pointing at it, and question four already caught those.

### Small batches (0:30)

[A timeline: batch of 20, gap of 4 to 6 weeks, next batch.]

Don't do it all at once. Work through about twenty pages, then wait four to six weeks before the next batch. If something goes wrong, you'll know which change caused it.

For a site under about a hundred posts, one full review a year is enough.

### Clean up and measure (0:40)

[A checklist ticks off: internal links, sitemap, redirect chains, log.]

After each batch, four jobs. Point internal links at the final URLs. Take removed URLs out of your sitemap. Fix any chains, where one redirect leads to another. And log every URL, the action, where it went and the date.

[The same Search Console comparison, four to eight weeks later.]

Then wait four to eight weeks and run the same comparison. You're not looking for one page to jump. You're checking that the pages you kept are holding or growing, and that nothing you removed was quietly doing a job.

### Close (0:40)

[Flowra Demo site: the Content Decay Map, labelled Example data. Zoom to pages with falling clicks.]

Building that first list by hand takes a while, and that's why I built this into Flowra. The content decay report finds the pages whose clicks and impressions are falling, from your Search Console data, and it's on the free plan.

[Tag a change on a page. Before and after comparison.]

And when you change a page, you can tag the change and Flowra compares the period before and after.

[The finished sheet. End screen: subscribe, Tutorial 1.]

The link's below. Start with twenty pages and the five questions. If you get stuck on one, tell me in the comments and I'll help you work out where it lands.
