"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import { ProfileCard } from "@/components/ui/ProfileCard";
import { TweetCard } from "@/components/ui/TweetCard";

// Define a simple Skeleton Loader component
const SkeletonLoader = () => (
  <div className="space-y-2 animate-pulse">
    <div className="h-4 bg-gray-600 rounded w-3/4"></div>
    <div className="h-4 bg-gray-600 rounded w-1/2"></div>
    <div className="h-4 bg-gray-600 rounded w-5/6"></div>
  </div>
);

// Define return types for the parser
type ParsedText = { type: 'text'; data: string };
type ProfileData = { username: string; bio: string; imageUrl: string; displayName?: string; verified?: boolean };
type ParsedProfile = { type: 'profile'; data: ProfileData };
type TweetData = { author: string; date: string; text: string; imageUrl: string; additionalText?: string; tweetUrl?: string };
type ParsedTweet = { type: 'tweet'; data: TweetData };
// New type to handle multiple cards
type ParsedMultiCard = { type: 'multi_card'; summary?: string; cards: (ParsedProfile | ParsedTweet)[] };
// Update ParsedContent to include the new type
type ParsedContent = ParsedText | ParsedProfile | ParsedTweet | ParsedMultiCard | { type: 'error'; data: string } | { type: 'loading' };

// Message structure in state
interface UserMessage {
  role: 'user';
  content: string; // User messages are always strings
}
interface AssistantMessage {
  role: 'assistant';
  content: ParsedContent; // Assistant messages store parsed content
}
type Message = UserMessage | AssistantMessage;

export default function Home() {
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadingInterval = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // Ref for scrolling

  // Auto-scroll effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // Run when messages change

  async function handleSend() {
    const trimmedSearch = search.trim();
    if (!trimmedSearch) return;

    const userMessage: UserMessage = { role: "user", content: trimmedSearch };
    // Add user message and a loading placeholder for the assistant
    const loadingMessage: AssistantMessage = { role: "assistant", content: { type: 'loading' } };
    setMessages((msgs) => [...msgs, userMessage, loadingMessage]);

    setSearch("");
    setIsLoading(true); // Set loading state

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedSearch }), // Use trimmedSearch
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', Array.from(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      const assistantText = data.result?.text || "";

      // Parse the content *before* updating state
      const parsedAssistantContent = parseMessageContent(assistantText);

      setMessages((msgs) => {
        // Replace the loading placeholder with the parsed content
        const updated = [...msgs];
        const lastMessageIndex = updated.length - 1;
        if (lastMessageIndex >= 0 && updated[lastMessageIndex].role === 'assistant' && (updated[lastMessageIndex].content as ParsedContent).type === 'loading') {
           updated[lastMessageIndex] = { role: 'assistant', content: parsedAssistantContent };
        } else {
           // Fallback: If the last message wasn't the loading placeholder (unexpected), just add the new message
           updated.push({ role: 'assistant', content: parsedAssistantContent });
        }
        return updated;
      });

    } catch (err: any) {
      console.error('Error in handleSend:', err);
      const errorMessage: AssistantMessage = {
          role: "assistant",
          content: { type: 'error', data: `Error fetching response: ${err.message || 'Unknown error'}` }
      };
      setMessages((msgs) => {
         // Replace the loading placeholder with the error message
        const updated = [...msgs];
        const lastMessageIndex = updated.length - 1;
        if (lastMessageIndex >= 0 && updated[lastMessageIndex].role === 'assistant' && (updated[lastMessageIndex].content as ParsedContent).type === 'loading') {
           updated[lastMessageIndex] = errorMessage;
        } else {
           // Fallback: If the last message wasn't the loading placeholder, add the error message
           updated.push(errorMessage);
        }
        return updated;
      });
    } finally {
       setIsLoading(false); // Ensure loading is set to false
    }
  }

  const hasMessages = messages.length > 0;

  // Helper function to parse message content - now returns ParsedContent
  function parseMessageContent(text: string): ParsedContent {
    if (!text) return { type: 'text', data: '' };

    const cards: (ParsedProfile | ParsedTweet)[] = [];
    let remainingText = text;
    let summary: string | undefined = undefined;

    // Extract potential summary first
    const summaryMatch = remainingText.match(/^(Search strategy:|Here are the latest tweets from @\w+:|I searched for .*?:)\s*([\s\S]*?)(?=PROFILE_CARD::|TWEET_CARD::|$)/i);
    if (summaryMatch) {
        summary = (summaryMatch[1] + (summaryMatch[2] ? summaryMatch[2].trim() : '')).trim();
        if (remainingText.length > summary.length) {
           const summaryStartIndex = remainingText.toLowerCase().indexOf(summary.toLowerCase()); // Case-insensitive search for summary
           if (summaryStartIndex !== -1) {
              remainingText = remainingText.substring(summaryStartIndex + summary.length).trim();
           }
        } else {
            remainingText = '';
        }
    }

    // Split potential cards
    const parts = remainingText.split(/(?=PROFILE_CARD::|TWEET_CARD::)/);

    parts.forEach(part => {
      const trimmedPart = part.trim();
      if (trimmedPart.startsWith("PROFILE_CARD::")) {
        const cardText = trimmedPart.substring("PROFILE_CARD::".length).trim();
        const lines = cardText.split(/\r?\n/); // Split by newline
        const data: ProfileData = { username: '', bio: '', imageUrl: '', displayName: undefined, verified: undefined };
        let currentKey: keyof ProfileData | null = null;
        let accumulatingValue = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          const match = line.match(/^(\w+):\s*(.*)$/);

          if (match) { // Found a key: value pair on the same line
            // Store previous accumulated value if any
            if (currentKey && accumulatingValue) {
               if (currentKey === 'bio') data[currentKey] = accumulatingValue.trim();
            }
            accumulatingValue = ''; // Reset accumulator

            const key = match[1];
            let value = match[2].trim();
            currentKey = null;

            if (key === 'Username') { data.username = value; }
            else if (key === 'DisplayName') { data.displayName = value; }
            else if (key === 'Verified') { data.verified = value.toLowerCase() === 'true'; }
            else if (key === 'ProfileURL') { /* data.profileUrl = value; */ } // Assuming ProfileURL might be added later
            else if (key === 'ImageURL') {
               const urlMatch = value.match(/https?:\/\/[^\s)\]]+/);
               data.imageUrl = urlMatch ? urlMatch[0] : '';
            }
             else if (key === 'Bio') {
               currentKey = 'bio';
               accumulatingValue = value + '\n'; // Start accumulating for Bio
            }
          } else if (line.match(/^Bio:$/i)) { // Key only, value starts on next line (for Bio)
             if (currentKey && accumulatingValue) { // Store previous key's value
                 if (currentKey === 'bio') data[currentKey] = accumulatingValue.trim();
             }
             currentKey = 'bio';
             accumulatingValue = ''; // Start accumulating for Bio
          } else if (line.match(/^ImageURL:$/i)) { // Key only, value on next line
             if (currentKey && accumulatingValue) { if (currentKey === 'bio') data[currentKey] = accumulatingValue.trim(); }
             accumulatingValue = ''; currentKey = null;
             if (i + 1 < lines.length) {
                const nextLine = lines[i+1].trim();
                const urlMatch = nextLine.match(/https?:\/\/[^\s)\]]+/);
                data.imageUrl = urlMatch ? urlMatch[0] : '';
                i++; // Skip the next line as it was consumed
             }
          } else if (currentKey === 'bio') {
            // Continue accumulating for Bio
            accumulatingValue += line + '\n';
          }
        }
         // Store any remaining accumulated value for Bio
         if (currentKey === 'bio' && accumulatingValue) {
            data.bio = accumulatingValue.trim();
         }

        if (data.username && data.bio && data.imageUrl) {
          cards.push({ type: 'profile', data });
        }
      } else if (trimmedPart.startsWith("TWEET_CARD::")) {
        const cardText = trimmedPart.substring("TWEET_CARD::".length).trim();
        const lines = cardText.split(/\r?\n/); // Split by newline
        const data: TweetData = { author: '', date: '', text: '', imageUrl: '', additionalText: '', tweetUrl: '' };
        let currentKey: keyof TweetData | null = null;
        let accumulatingValue = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]; // Don't trim here, preserve indentation for Tweet/Additional_Text?
          const trimmedLine = line.trim();
          // Match "Key: Value" or "Key:" (value on next line or multi-line)
          const match = trimmedLine.match(/^([a-zA-Z_]+):\s*(.*)$/);
          const keyOnlyMatch = trimmedLine.match(/^([a-zA-Z_]+):$/);

          let key: string | null = null;
          let value: string | null = null;
          let isKeyOnly = false;

          if (match) {
             key = match[1];
             value = match[2].trim();
          } else if (keyOnlyMatch) {
             key = keyOnlyMatch[1];
             isKeyOnly = true;
          }

          if (key) {
            // Store previous accumulated value if any
            if (currentKey && accumulatingValue) {
               if (currentKey === 'text' || currentKey === 'additionalText') {
                    data[currentKey] = accumulatingValue.trim();
               }
            }
            accumulatingValue = ''; // Reset accumulator
            currentKey = null;

            const lowerKey = key.toLowerCase();

            if (lowerKey === 'author') { data.author = value ?? ''; }
            else if (lowerKey === 'date') { data.date = value ?? ''; }
            else if (lowerKey === 'imageurl') {
                if (value) {
                    const urlMatch = value.match(/https?:\/\/[^\s)\]]+/);
                    data.imageUrl = urlMatch ? urlMatch[0] : '';
                } else if (isKeyOnly && i + 1 < lines.length) { // Value on next line
                    const nextLine = lines[i+1].trim();
                    const urlMatch = nextLine.match(/https?:\/\/[^\s)\]]+/);
                    data.imageUrl = urlMatch ? urlMatch[0] : '';
                    i++; // Skip consumed line
                }
            }
            else if (lowerKey === 'tweeturl') {
                if (value) {
                     data.tweetUrl = value;
                } else if (isKeyOnly && i + 1 < lines.length) { // Value on next line
                    data.tweetUrl = lines[i+1].trim();
                    i++; // Skip consumed line
                }
            }
            else if (lowerKey === 'tweet' || lowerKey === 'text') {
               currentKey = 'text';
               accumulatingValue = (value ? value + '\n' : ''); // Start accumulating
            }
            else if (lowerKey === 'additional_text') {
               currentKey = 'additionalText';
               accumulatingValue = (value ? value + '\n' : ''); // Start accumulating
            }
          } else if (currentKey === 'text' || currentKey === 'additionalText') {
             // Continue accumulating for multi-line text field, preserving original line breaks/indentation
             accumulatingValue += line + '\n';
          }
        }
        // Store any remaining accumulated value
        if (currentKey && accumulatingValue) {
           if (currentKey === 'text' || currentKey === 'additionalText') {
                data[currentKey] = accumulatingValue.trimEnd(); // Trim only trailing whitespace/newlines
           }
        }

        // Ensure text is not empty (handle cases where only Additional_Text was present)
        if (!data.text && data.additionalText) {
           data.text = data.additionalText;
           data.additionalText = '';
        }

        if (data.author && data.date && data.text && data.imageUrl) {
          cards.push({ type: 'tweet', data });
        }
      }
    });

    // Determine final ParsedContent type
    if (cards.length > 0) {
       // Return the extracted summary (if any) and the parsed cards.
       // Discard the remainingText as its content has been processed into cards.
       return { type: 'multi_card', summary: summary || undefined, cards };
    }

    // If no cards found, return original text (potentially with summary if it existed)
    const finalText = summary ? `${summary}${remainingText ? `\n\n${remainingText}` : ''}`.trim() : text;
    return { type: 'text', data: finalText };
  }

  return (
    <div className="min-h-screen bg-[#18191b] flex flex-col text-white">
      {/* Main Chat Area */}
      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col gap-4 pt-8 pb-32 px-4 overflow-y-auto">
        {hasMessages ? (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`w-full flex ${msg.role === "user" ? "justify-end" : "justify-start"} transition-opacity duration-300 opacity-100`}
            >
              {msg.role === "user" ? (
                // User message rendering
                <div className="max-w-[70%] px-4 py-2 rounded-xl text-base bg-[#4a4b4f] text-white rounded-br-none">
                   {/* Replace escaped newlines with actual newlines for display */}
                   {msg.content.split('\\n').map((line, index) => (
                      <span key={index}>
                          {line}
                          <br />
                      </span>
                  ))}
                </div>
              ) : (
                // Assistant message rendering - directly use parsed content
                <div className="max-w-[80%] w-full">
                  {(() => {
                    // Type guard for AssistantMessage content
                    const content = msg.content as ParsedContent;

                    switch (content.type) {
                      case 'loading':
                        return <SkeletonLoader />;
                      case 'error':
                        return (
                           <div className="prose prose-invert prose-sm max-w-none p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300">
                             <ReactMarkdown>{content.data}</ReactMarkdown>
                           </div>
                        );
                      case 'multi_card':
                        return (
                          <div className="space-y-4">
                            {content.summary && (
                              <div className="prose prose-invert prose-sm max-w-none p-3 rounded-lg bg-[#232427]">
                                 {/* Replace escaped newlines for display */}
                                 <ReactMarkdown>{content.summary.replace(/\\n/g, '\n')}</ReactMarkdown>
                              </div>
                            )}
                            {content.cards.map((card, index) => {
                              if (card.type === 'profile') {
                                // Pass optional props if available
                                return <ProfileCard key={`profile-${index}`} {...card.data} displayName={card.data.displayName} verified={card.data.verified} />;
                              } else if (card.type === 'tweet') {
                                // Pass additionalText as a prop to TweetCard
                                return (
                                  <TweetCard
                                     key={`tweet-${index}`}
                                     {...card.data}
                                     text={card.data.text.replace(/\\n/g, '\n')}
                                     additionalText={card.data.additionalText?.replace(/\\n/g, '\n')}
                                     tweetUrl={card.data.tweetUrl}
                                  />
                                );
                              }
                              return null;
                            })}
                          </div>
                        );
                      case 'text':
                      default:
                        // Default rendering for plain text (Assistant message)
                        return (
                          <div className="prose prose-invert prose-sm max-w-none text-[#ededed]">
                             {/* Replace escaped newlines for display */}
                             {typeof content.data === 'string' ? <ReactMarkdown>{content.data.replace(/\\n/g, '\n')}</ReactMarkdown> : null}
                          </div>
                        );
                    }
                  })()}
                </div>
              )}
            </div>
          ))
        ) : (
          // Empty State Content
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <h1 className="text-3xl font-semibold text-gray-400">Grok + Twitter Search</h1>
            <p className="mt-2 text-gray-500">Powered by Composio</p>
          </div>
        )}
        {/* Dummy div to ensure scrolling works to the very bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Area */}
      <div className="sticky bottom-0 left-0 right-0 w-full bg-[#18191b] border-t border-gray-700/50">
        <div className="max-w-2xl mx-auto pb-6 pt-4 px-4">
          <div className="flex items-center bg-[#232427] rounded-2xl px-4 py-2 shadow-lg border border-transparent w-full">
            <Input
              className="flex-1 bg-transparent border-none text-base placeholder:text-[#6e6e6e] focus:ring-0 focus-visible:ring-0 focus:outline-none px-0"
              placeholder="What do you want to know?"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !isLoading) handleSend(); }} // Prevent sending while loading
              disabled={isLoading} // Disable input while loading
            />
            <Button
               className="ml-3 rounded-lg bg-[#35363a] hover:bg-[#4a4b4f] p-2 w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-50"
               size="icon"
               onClick={handleSend}
               disabled={isLoading || !search.trim()} // Disable button while loading or if input is empty
            >
              {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
