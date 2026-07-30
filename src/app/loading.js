export default function Loading() {
  return (
    <div className="container-fluid loading-page">
      <div className="loading-ring" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className="loading-text">Decoding device data…</p>
    </div>
  );
}
