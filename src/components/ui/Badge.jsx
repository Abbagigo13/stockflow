export default function Badge({
  children,
  variant = "default",
}) {
  return (
    <span className={`sf-badge sf-badge-${variant}`}>
      {children}
    </span>
  );
}