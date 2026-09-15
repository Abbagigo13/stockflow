export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`sf-button sf-button-${variant} ${className}`}
    >
      {children}
    </button>
  );
}