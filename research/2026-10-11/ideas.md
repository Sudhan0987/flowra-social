# What to post next (2026-10-11)

AI is the main thread this month: Google's AI Overviews survived the Chegg and Penske lawsuits, Google is testing payments to publishers for AI Mode, and people are building tools to check whether ChatGPT and Perplexity cite them while arguing that AI visibility is being measured the wrong way. Site owners are also annoyed by AI bot traffic and AI crawler blocking, and they are uneasy about AI drafts now that Google has told sites to fact-check AI content and writers report ChatGPT contradicting their own work. Google timing is still news after Gary Illyes shared Google's own figures in Barcelona, and Google's google.com/goto anti-scraping change drew one of the biggest discussions on Hacker News.

## 1. Impressions held, clicks fell: the one Search Console check for pages AI answers are eating (reel, news)
Hook: Your impressions holding steady doesn't mean your clicks did. One Search Console check shows which pages.

A judge has thrown out the Chegg and Penske suits over AI Overviews, and Google is testing payments to publishers for AI Mode, so AI answers are not going away. This follows r006 as planned: one quiet clicks-falling check (Pages tab, clicks and impressions on, compare periods, find flat impressions with falling clicks), shown on screen in the first 2 seconds, 20 to 25 seconds long, ending with 'save this for your next audit'.

- https://reuters.com/legal/litigation/google-wins-dismissal-chegg-penske-media-lawsuits-over-ai-overviews-2026-10-01
- https://searchengineland.com/google-tests-paying-publishers-for-using-its-content-in-ai-mode-ai-overviews-and-gemini-488382

## 2. Your robots.txt allows GPTBot. Your host might still be blocking it. (linkedin, myth)
Hook: Your robots.txt saying yes to GPTBot doesn't mean GPTBot gets in, until you check what your host does at the edge.

An Ask HN thread says AI bot traffic is out of control, and a r/bigseo thread counted how many top sites block AI crawlers in robots.txt, so people think robots.txt settles it. We found the opposite on our own site: our web host blocked GPTBot at the edge with HTTP 429 even though robots.txt allowed it, while other AI crawlers got through.

- https://news.ycombinator.com/item?id=49705724
- https://www.reddit.com/r/bigseo/comments/1x28e0h/we_checked_robotstxt_on_the_top_10000_sites_193/

## 3. Moving your site? Google's own range is 1 to 3 months (reel, news)
Hook: A site move doesn't settle in a week. Google's own number is 1 to 3 months, and the slow end is a year.

Gary Illyes showed Google's internal timings at Search Central Live in Barcelona: a site move usually takes 1 to 3 months, and the slowest take 6 months to more than a year. Our Google timing reels keep growing on YouTube, and this is a different number from the page update reel we already published. Open on a day counter and keep it to 20 to 25 seconds.

- https://www.reddit.com/r/bigseo/comments/1x21aex/google_shared_how_long_crawling_indexing_and_core/

## 4. Google's advice on AI content: check it before you publish (linkedin, news)
Hook: Google's advice on AI content isn't 'stop using it'. It's 'check it before you publish'.

Search Engine Journal reports that Google told sites to fact-check AI content before publishing. Writers in r/content_marketing (13 comments) say ChatGPT and Claude contradict their own technical writing when proofreading. Flowra's writer starts with an outline you approve or edit, and the Rework Queue shows what changed before anything goes live.

- https://www.searchenginejournal.com/google-fact-check-ai-content-before-publishing/591782/
- https://www.reddit.com/r/content_marketing/comments/1x1u1qs/has_anyone_else_experienced_chatgpt_or_claude/

## 5. Google is fighting scrapers. Your position data doesn't need them. (x, news)
Hook: Your ranking data doesn't have to come from scraping Google. Search Console already has it.

The google.com/goto anti-scraping post got 681 points and 554 comments on Hacker News, the biggest search discussion in the set. Flowra doesn't scrape Google: its positions come from Search Console, with 16 months of history.

- https://www.autom.dev/blog/google-search-goto-links

## 6. Being cited by ChatGPT next to actually getting the visit (carousel, myth)
Hook: Your brand showing up in ChatGPT doesn't mean anyone clicked through to you.

New Show HN tools track whether ChatGPT and Perplexity mention a site. One test found the two agreed on only 1 in 4 local recommendations, and a r/bigseo post says AI visibility is being measured the wrong way. Flowra reads ChatGPT and Perplexity visits from GA4 referrers, so it counts visits that arrived, and it cannot see answers that sent no click.

- https://citerank.thecompound.tech
- https://www.clicksdynasty.com/blog-post-chatgpt-perplexity-local-recommendations.html
- https://www.reddit.com/r/bigseo/comments/1x2alme/i_think_were_measuring_ai_search_visibility_the/
- https://ukaiseoconsultant.co.uk/ai-driven-seo-audits/

## 7. Floey gets graded by an AI detector that never read the words (reel, fun)
Hook: Your blog post just got its report card from a model that only looked at the layout.

A Show HN about spotting AI web content from page structure alone got 74 points and 28 comments. Commenters asked whether it would also flag human-written filler as AI. That makes an easy, funny report card reel: Floey holds the verdict and gives no made-up scores.

- https://arxiv.org/abs/2609.15369

## 8. Skip building a content board in Notion: Flowra's Free plan already has one (linkedin, product)
Hook: You're still building your content workflow in Notion from scratch. Flowra's Free plan already has a Task Board and a Content Workflow Board.

Two r/SEO posts this week walk through Notion setups for running a whole content operation, so teams are clearly building this by hand. Every Flowra plan, Free included, comes with the Task Board, the Content Workflow Board and the Content Repository.

- https://www.reddit.com/r/SEO/comments/1x300x3/built_a_6module_seo_content_workspace_in_notion/
- https://www.reddit.com/r/SEO/comments/1x2zmh5/i_built_a_notion_system_to_manage_my_entire/
