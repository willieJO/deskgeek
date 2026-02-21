export default function ButtonSpinner({ className = "" }) {
  const spinnerClassName = ["ui-inline-spinner", className].filter(Boolean).join(" ");
  return <span className={spinnerClassName} aria-hidden="true" />;
}
