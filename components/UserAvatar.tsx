"use client"
import Link from "next/link";
import React from "react";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constant/route";

interface AvatarProps {
  id: string;
  name: string;
  imageUrl?: string;
  className?: string;
  fullbackClassname?: string;
}
const UserAvatar = ({
  id,
  name,
  imageUrl,
  className = "h-9 w-9",
  fullbackClassname,
}: AvatarProps) => {
  const initials = name
    .split(" ")
    .map((word: string) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={ROUTES.PROFILE(id)}>
      <Avatar className={className}>
        {imageUrl ? (
          <AvatarImage src={imageUrl} alt={name} className="object-cover" />
        ) : (
          <AvatarFallback
            className={cn(
              "font-space-grotesk font-bold tracker-wider text-black dark:text-white",
              fullbackClassname
            )}
          >
            {initials}
            <AvatarImage
              src="/path/to/default-avatar.jpg"
              alt={name}
              className="object-cover"
            />
          </AvatarFallback>
        )}
      </Avatar>
    </Link>
  );
};

export default UserAvatar;
