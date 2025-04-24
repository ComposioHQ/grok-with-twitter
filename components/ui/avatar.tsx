"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import Image, { StaticImageData } from "next/image"
import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

interface AvatarImageProps extends Omit<React.ComponentProps<typeof AvatarPrimitive.Image>, 'src'> {
  src: string | StaticImageData;
  alt?: string;
}

function AvatarImage({
  className,
  src,
  alt = "Avatar",
  ...props
}: AvatarImageProps) {
  return (
    <AvatarPrimitive.Image asChild className={cn("aspect-square size-full", className)} {...props}>
      <Image
        src={src}
        alt={alt}
        width={100}
        height={100}
        style={{ objectFit: "cover" }}
        unoptimized
        priority={false}
        onError={(e) => {
          console.error("Next/Image Error loading:", src, e);
        }}
      />
    </AvatarPrimitive.Image>
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
