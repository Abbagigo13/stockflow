export default function Loading({ text = "Loading..." }) {
  return (
    <div className="sf-loading">
      <div className="sf-loading-spinner" />

      <span>{text}</span>
    </div>
  );
}