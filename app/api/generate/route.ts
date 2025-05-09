import { NextRequest } from 'next/server';
import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai'
import { VercelAIToolSet } from 'composio-core';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required.' }), { status: 400 });
    }

    // You should securely load your API key from environment variables
    const toolset = new VercelAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY! });
    console.log(process.env.COMPOSIO_API_KEY)
    const tools = await toolset.getTools({ actions: ["TWITTER_RECENT_SEARCH", 
                                                     "TWITTER_USER_LOOKUP_BY_USERNAME",
                                                     "TWITTER_USER_LOOKUP_ME",
                                                     "TWITTER_FOLLOW_USER",
                                                     "TWITTER_CREATION_OF_A_POST",
                                                     "SERPAPI_SEARCH",
                                                     "TWITTER_UNFOLLOW_USER",
                                                     "GOOGLECALENDAR_GET_CURRENT_DATE_TIME"] });

    const result = await generateText({
      model: xai('grok-3-mini'),
      system: `You are an expert at searching Twitter/X.com using advanced search techniques.
- For every user query, always rewrite and transform the prompt before sending it to the tool's query parameter.
- For tweet searches, use the query string format (e.g., 'from:username') in the query parameter, as in '(from:sama)'. Do NOT include date filters like 'since:' or 'until:' in the query string itself.
- For profile lookups, the query parameter should only be '@username' (e.g., '@_sonith'), with no filters or date ranges in the query string.
- When using TWITTER_USER_LOOKUP_BY_USERNAME action:
  - For profile picture lookups, pass only 'profile_image_url' in the user__field parameter
  - For user ID lookups, pass only 'id' in the user__field parameter
  - Never pass multiple fields in user__field parameter
- When referencing Twitter usernames, always include the '@' symbol (e.g., '@elonmusk') in the rewritten query, even if the user omits it.
- For things you couldn't find directly with twitter search like user bio, use serpapi search

*** CRITICAL DATE HANDLING INSTRUCTIONS FOR TWEET SEARCHES: ***
1.  **ALWAYS call the GOOGLECALENDAR_GET_CURRENT_DATE_TIME tool FIRST** to get the current accurate date and time before determining dates for a Twitter search.
2.  Calculate the 'start_published_date' and 'end_published_date' based on the **current date/time from the Calendar tool** and the user's request (e.g., "last 7 days", "yesterday", "between date A and B").
3.  The 'start_published_date' **MUST NOT** be in the future relative to the current time from the Calendar tool.
4.  The 'end_published_date' **MUST** be set to the current time from the Calendar tool, MINUS a small buffer (e.g., subtract 1 minute) to ensure it's slightly in the past. This is required by the Twitter API.
5.  Pass these calculated dates ONLY as the 'start_published_date' and 'end_published_date' parameters to the TWITTER_RECENT_SEARCH tool in ISO8601 format (YYYY-MM-DDTHH:mm:ssZ).
6.  **NEVER** include 'since:' or 'until:' operators within the 'query' string parameter itself. Use the dedicated date parameters.
7.  **DEFAULT TIME PERIOD:** If the user query implies recency but is vague (e.g., "latest tweets", "most recent posts"), interpret this as **the last 7 days**. Calculate 'start_published_date' as (current time - 7 days) and 'end_published_date' as (current time - 1 minute).
8.  If the user query does *not* imply any date range at all (e.g., "tweets about topic X from @user"), you might omit 'start_published_date', but you **MUST** still calculate and provide 'end_published_date' (current time - 1 minute) as described above.

- Never include date filters or advanced search operators in the query string for profile lookups (TWITTER_USER_LOOKUP_BY_USERNAME tool).
- Never pass 'category' or use the autoprompt feature for any tool.
- Always call the TWITTER_RECENT_SEARCH tool with parameters in this format when dates are needed:
  - query: Rewritten query (e.g., '(from:someuser)')
  - text: true
  - include_domains: ["x.com", "twitter.com"]
  - livecrawl: "always"
  - start_published_date: Calculated ISO8601 string (Not in future)
  - end_published_date: Calculated ISO8601 string (Current time - 1 minute)
- Always use these parameter names and types.

***Output Formatting Instructions:***
- **CRITICAL:** ALWAYS explain the search strategy you used, *including the exact date range calculated and used*, in a short summary at the **VERY TOP** of your response, BEFORE any PROFILE_CARD or TWEET_CARD.
- When returning profile information, structure it **EXACTLY** like this, starting with PROFILE_CARD::
  PROFILE_CARD::
  Username: @username
  Bio: User bio text...
  ImageURL: https://pbs.twimg.com/profile_images/... (full profile image URL - ONLY the raw URL string)
  ProfileURL: https://x.com/username
- When returning tweet information, structure it **EXACTLY** like this, starting with TWEET_CARD::
  TWEET_CARD::
  Author: @author_username
  Date: YYYY-MM-DD HH:MM:SS
  Tweet: Full tweet text...
  Additional_Text: Comment based on the tweet
  ImageURL: https://pbs.twimg.com/profile_images/... (The **author's profile image URL** - ONLY the raw URL string)
  TweetURL: https://x.com/author_username/status/tweet_id (The **full URL to the specific tweet**)
- **IMPORTANT:** The ImageURL fields (for both profile and tweet) MUST contain ONLY the raw URL string (e.g., https://...) and NEVER include any markdown formatting like [...] (...).
- For regular text responses, just return the text without any special prefix.
- When asked to create a tweet or post, use the TWITTER_CREATION_OF_A_POST tool. Pass the tweet content in the 'text' parameter. Provide confirmation to the user after calling the tool.
- Return a response always
`,
      tools,
      prompt,
      maxSteps: 20,
      temperature: 0.1,
      maxRetries: 20
    });
    console.log(result)
    // Return a streaming response  
    return new Response(JSON.stringify({result}));
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), { status: 500 });
  }
} 