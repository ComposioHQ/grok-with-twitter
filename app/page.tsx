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
type ProfileData = { username: string; bio: string; imageUrl: string };
type ParsedProfile = { type: 'profile'; data: ProfileData };
type TweetData = { author: string; date: string; text: string; imageUrl: string; additionalText?: string; tweetUrl?: string };
type ParsedTweet = { type: 'tweet'; data: TweetData };
// New type to handle multiple cards
type ParsedMultiCard = { type: 'multi_card'; summary?: string; cards: (ParsedProfile | ParsedTweet)[] };
// Update ParsedContent to include the new type
type ParsedContent = ParsedText | ParsedProfile | ParsedTweet | ParsedMultiCard;

export default function Home() {
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDots, setLoadingDots] = useState("");
  const loadingInterval = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // Ref for scrolling

  // Auto-scroll effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // Run when messages change

  // Loading dots effect
  useEffect(() => {
    if (loading) {
      let count = 0;
      loadingInterval.current = setInterval(() => {
        setLoadingDots(".".repeat((count % 3) + 1));
        count++;
      }, 400);
    } else {
      setLoadingDots("");
      if (loadingInterval.current) clearInterval(loadingInterval.current);
    }
    return () => {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
    };
  }, [loading]);

  async function handleSend() {
    if (!search.trim()) return;
    const userMessage = { role: "user", text: search };
    setMessages((msgs) => [...msgs, userMessage]);
    setSearch("");
    setLoading(true);
    // Add a placeholder for the assistant's streaming response
    setMessages((msgs) => [...msgs, { role: "assistant", text: "" }]);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: search }),
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', Array.from(response.headers.entries()));
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const data = await response.json();
      console.log('Received data:', data);
      const assistantText = data.result?.text || "";
      setMessages((msgs) => {
        // Update the last assistant message with the new text
        const updated = [...msgs];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === "assistant") {
            updated[i] = { ...updated[i], text: assistantText };
            break;
          }
        }
        return updated;
      });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setMessages((msgs) => {
        // Replace the last assistant message with an error
        const updated = [...msgs];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === "assistant") {
            updated[i] = { ...updated[i], text: "Error fetching response." };
            break;
          }
        }
        return updated;
      });
      console.error('Error in handleSend:', err);
    }
  }

  const hasMessages = messages.length > 0;

  // Helper function to parse message content
  function parseMessageContent(text: string): ParsedContent {
    if (!text) return { type: 'text', data: '' };

    const cards: (ParsedProfile | ParsedTweet)[] = [];
    let remainingText = text;
    let summary: string | undefined = undefined;

    // Extract potential summary first
    const summaryMatch = remainingText.match(/^(Search strategy:|Here are the latest tweets from @\w+:)\s*([\s\S]*?)(?=PROFILE_CARD::|TWEET_CARD::|$)/i);
     if (summaryMatch) {
        summary = (summaryMatch[1] + (summaryMatch[2] ? summaryMatch[2].trim() : '')).trim();
        remainingText = remainingText.substring(remainingText.indexOf(summary) + summary.length).trim();
    }

    // Split potential cards
    const parts = remainingText.split(/(?=PROFILE_CARD::|TWEET_CARD::)/);

    parts.forEach(part => {
      const trimmedPart = part.trim();
      if (trimmedPart.startsWith("PROFILE_CARD::")) {
        const lines = trimmedPart.substring("PROFILE_CARD::".length).trim().split('\n');
        const data = lines.reduce((acc, line) => {
          const [key, ...valueParts] = line.split(': ');
          const value = valueParts.join(': ').trim();
          if (key === 'Username') acc.username = value;
          if (key === 'Bio') acc.bio = value;
          if (key === 'ImageURL') acc.imageUrl = value;
          return acc;
        }, { username: '', bio: '', imageUrl: '' });
        if (data.username && data.bio && data.imageUrl) {
          cards.push({ type: 'profile', data });
        }
        console.log('Parsed Profile Image URL:', data.imageUrl);
      } else if (trimmedPart.startsWith("TWEET_CARD::")) {
        const lines = trimmedPart.substring("TWEET_CARD::".length).trim().split('\n');
        const data = lines.reduce((acc, line) => {
          const [key, ...valueParts] = line.split(': ');
          const value = valueParts.join(': ').trim();
          if (key === 'Author') acc.author = value;
          if (key === 'Date') acc.date = value;
          if (key === 'Tweet') acc.text = value;
          if (key === 'Additional_Text') acc.additionalText = value;
          if (key === 'ImageURL') acc.imageUrl = value;
          if (key === 'TweetURL') acc.tweetUrl = value;
          return acc;
        }, { author: '', date: '', text: '', additionalText: '', imageUrl: '', tweetUrl: '' });
        console.log('Parsed Tweet Image URL:', data.imageUrl);
        console.log('Parsed Tweet URL:', data.tweetUrl);

        // Robust multi-line text handling
        let textIndex = lines.findIndex(line => line.startsWith('Text:'));
        if (textIndex !== -1) {
            data.text = lines.slice(textIndex).map(line => line.replace(/^Text:\s*/, '')).join('\n').trim();
        }
        if (data.author && data.date && data.text && data.imageUrl) {
            cards.push({ type: 'tweet', data });
        }
      }
    });

    if (cards.length > 0) {
      return { type: 'multi_card', summary, cards };
    }

    // If no cards found, return original text (potentially with summary removed if it existed)
    return { type: 'text', data: summary ? `${summary}\n\n${remainingText}`.trim() : text };
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
                <div className="max-w-[70%] px-4 py-2 rounded-xl text-base bg-[#4a4b4f] text-white rounded-br-none">
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-[80%] w-full">
                  {(() => {
                    if (msg.text === "" && loading && i === messages.length - 1) {
                      return <SkeletonLoader />;
                    }

                    const parsedContent = parseMessageContent(msg.text);

                    if (parsedContent.type === 'multi_card') {
                      return (
                        <div className="space-y-4">
                          {parsedContent.summary && (
                            <div className="prose prose-invert prose-sm max-w-none p-3 rounded-lg bg-[#232427]">
                              <ReactMarkdown>{parsedContent.summary}</ReactMarkdown>
                            </div>
                          )}
                          {parsedContent.cards.map((card, index) => {
                            if (card.type === 'profile') {
                              return <ProfileCard key={`profile-${index}`} {...card.data} />;
                            } else if (card.type === 'tweet') {
                              return (
                                <div key={`tweet-wrap-${index}`}>
                                  <TweetCard key={`tweet-${index}`} {...card.data} text={card.data.text} tweetUrl={card.data.tweetUrl} />
                                  {card.data.additionalText && card.data.additionalText.length > 0 ? (
                                    <div className="mt-2 text-[#ededed] text-base break-words whitespace-pre-line bg-transparent">
                                      {card.data.additionalText}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      );
                    } else {
                      // Default rendering for plain text (Assistant message)
                      return (
                        <div className="prose prose-invert prose-sm max-w-none text-[#ededed]">
                          {typeof parsedContent.data === 'string' ? <ReactMarkdown>{parsedContent.data}</ReactMarkdown> : null}
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
            <h1 className="text-3xl font-semibold text-gray-400">We gave Grok full access to Twitter</h1>
            <p className="mt-2 text-gray-500">Powered by Composio and AI SDK</p>
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
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            />
            <Button className="ml-3 rounded-lg bg-[#35363a] hover:bg-[#4a4b4f] p-2 w-10 h-10 flex items-center justify-center transition-colors" size="icon" onClick={handleSend}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
