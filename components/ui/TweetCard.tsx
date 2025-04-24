import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TweetCardProps {
  author: string; // e.g. "@karanvaidya6"
  date: string;   // ISO string or formatted
  text: string;
  imageUrl: string;
  displayName?: string; // Add this if you can get it from the backend
  verified?: boolean;   // Add this if you can get it from the backend
  tweetUrl?: string; // Add tweetUrl prop
  additionalText?: string; // Add additionalText prop
}

export function TweetCard({
  author,
  date,
  text,
  imageUrl,
  displayName,
  verified,
  tweetUrl, // Destructure tweetUrl
  additionalText, // Destructure additionalText
}: TweetCardProps) {
  // Format date as "23/04/2025, 08:45" or "14h" if you want relative
  const formattedDate = date
    ? new Date(date).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // Split text into first line and the rest
  const [firstLine, ...restLines] = text.split(/\r?\n/);
  const extraText = restLines.join("\n").trim();

  const cardContent = (
    <div className="flex items-start gap-3 flex-1">
      <Avatar className="relative flex size-8 shrink-0 overflow-hidden rounded-full">
        <AvatarImage 
          src={imageUrl} 
          alt={author}
          className="object-cover"
        />
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">
            {displayName || author.replace("@", "")}
          </span>
          {verified && (
            <svg
              className="inline-block w-4 h-4 text-blue-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M22.5 12l-2.1-2.1.3-3-3-.3L12 1.5 9.6 6.6l-3 .3.3 3L1.5 12l2.1 2.1-.3 3 3 .3L12 22.5l2.4-5.1 3-.3-.3-3z" />
            </svg>
          )}
          <span className="text-[#71767b] text-sm font-normal">
            {author}
          </span>
          <span className="text-[#71767b] text-xs font-normal ml-2">{formattedDate}</span>
        </div>
        <div className="mt-1 text-white text-base break-words whitespace-pre-line">
          {firstLine}
        </div>
        {/* Render additionalText below the main tweet text if it exists */}
        {additionalText && additionalText.length > 0 && (
          <div className="mt-2 text-[#a0a2a7] text-sm break-words whitespace-pre-line">
            {additionalText}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`flex p-4 bg-[#18191b] rounded-xl border border-[#232427] max-w-xl shadow-2xl shadow-black/75 transition-shadow hover:shadow-black/20 ${tweetUrl ? 'cursor-pointer' : ''} opacity:100%`}> {/* Updated shadow to 2xl and black/15, hover black/20 */}
      {tweetUrl ? (
        <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="flex flex-1 no-underline">
          {cardContent}
        </a>
      ) : (
        cardContent
      )}
    </div>
  );
}
