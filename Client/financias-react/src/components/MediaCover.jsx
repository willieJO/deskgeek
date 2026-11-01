import { useState } from "react";
import fallbackCover from "../assets/media-placeholder.svg";
import { coverImageCandidates } from "../utils/coverImages";

function CoverImage({ src, alt, ...props }) {
  const [attempt, setAttempt] = useState(0);
  const sources = [...new Set([...coverImageCandidates(src), fallbackCover])];
  return (
    <img
      {...props}
      src={sources[attempt]}
      alt={alt}
      onError={() =>
        setAttempt((previous) => Math.min(previous + 1, sources.length - 1))
      }
    />
  );
}

export default function MediaCover({ src, ...props }) {
  // A changed source starts with the best candidate, including after editing/uploading a cover.
  return <CoverImage key={src || fallbackCover} src={src} {...props} />;
}
