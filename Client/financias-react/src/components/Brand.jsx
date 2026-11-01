import { Layers3 } from "lucide-react";

export default function Brand({ compact = false }) {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <Layers3 size={23} strokeWidth={2} />
      </span>
      {!compact && (
        <span>
          Media<span>Dex</span>
          <small>Seu universo de histórias</small>
        </span>
      )}
    </span>
  );
}
