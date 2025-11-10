"use client";

import Image from "next/image";
import { useState } from "react";

export interface UserAvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: number; // pixels
  className?: string;
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name
    .trim()
    .replaceAll(/\s+/g, " ")
    .split(" ")
    .filter(
      (p) =>
        p.length > 0 &&
        !["de", "del", "la", "las", "el", "los", "y"].includes(p.toLowerCase())
    );
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const second = parts.length > 1 ? parts.at(-1)![0] : "";
  return (first + second).toUpperCase();
}

function hashColor(seed: string): string {
  const sum = seed
    .split("")
    .reduce((acc, c) => acc + (c.codePointAt(0) || 0), 0);
  const palette = [
    "bg-emerald-600",
    "bg-teal-600",
    "bg-sky-600",
    "bg-indigo-600",
    "bg-purple-600",
    "bg-rose-600",
    "bg-orange-600",
    "bg-lime-600",
  ];
  return palette[sum % palette.length];
}

export function UserAvatar({
  name,
  imageUrl,
  size = 24,
  className = "",
}: Readonly<UserAvatarProps>) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const color = hashColor(name || initials);

  const base =
    "inline-flex items-center justify-center rounded-full text-white font-semibold select-none overflow-hidden";

  const showImage = imageUrl && !imgError;

  return (
    <span
      aria-label={name || "Usuario"}
      className={`${base} ${className} ${showImage ? "" : color}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
    >
      {showImage ? (
        <Image
          src={imageUrl}
          alt={name || "Avatar"}
          width={size}
          height={size}
          className="rounded-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

export default UserAvatar;
