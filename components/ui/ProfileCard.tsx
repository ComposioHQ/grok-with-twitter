import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileCardProps {
  username: string;
  bio: string;
  imageUrl: string;
  displayName?: string;
  verified?: boolean;
}

export function ProfileCard({
  username,
  bio,
  imageUrl,
  displayName,
  verified,
}: ProfileCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-[#18191b] rounded-xl border border-[#232427] max-w-xl shadow-2xl shadow-black/75 transition-shadow hover:shadow-black/20">
      <Avatar className="relative flex size-8 shrink-0 overflow-hidden rounded-full">
        <AvatarImage 
          src={imageUrl} 
          alt={username}
          className="object-cover"
        />
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-lg">
            {displayName || username.replace("@", "")}
          </span>
          {verified && (
            <svg
              className="inline-block w-5 h-5 text-blue-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M22.5 12l-2.1-2.1.3-3-3-.3L12 1.5 9.6 6.6l-3 .3.3 3L1.5 12l2.1 2.1-.3 3 3 .3L12 22.5l2.4-5.1 3-.3-.3-3z" />
            </svg>
          )}
          <span className="text-[#71767b] text-base font-normal">
            {username}
          </span>
        </div>
        <div className="mt-1 text-[#ededed] text-base break-words whitespace-pre-line">
          {bio}
        </div>
      </div>
    </div>
  );
}
