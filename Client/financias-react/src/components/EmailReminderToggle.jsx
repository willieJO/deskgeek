import { useId } from "react";
import { BellRing } from "lucide-react";

export default function EmailReminderToggle({
  checked,
  onChange,
  disabled = false,
  label = "Lembrar lançamento desta obra",
  description = "Receba um e-mail no dia cadastrado, às 12h de Brasília. A preferência geral do perfil também precisa estar ativa.",
}) {
  const id = useId();
  return (
    <label
      className={`email-preference ${disabled ? "disabled" : ""}`}
      htmlFor={id}
    >
      <BellRing size={20} aria-hidden="true" />
      <span className="email-preference-copy">
        <strong>{label}</strong>
        <span id={`${id}-description`}>{description}</span>
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        aria-describedby={`${id}-description`}
      />
      <span className="email-toggle-track" aria-hidden="true" />
    </label>
  );
}
