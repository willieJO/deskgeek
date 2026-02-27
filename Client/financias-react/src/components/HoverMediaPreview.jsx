import "./hover-media-preview.css";

export default function HoverMediaPreview({ preview, cardRef }) {
  if (!preview) return null;

  return (
    <div className="hp-hover-preview-layer" aria-hidden="true">
      <article
        ref={cardRef}
        className="hp-hover-preview"
        style={{ left: `${preview.left}px`, top: `${preview.top}px` }}
      >
        <img src={preview.image} alt={preview.title} className="hp-hover-preview-image" />
        <div className="hp-hover-preview-info">
          {preview.meta ? <p className="hp-hover-preview-meta">{preview.meta}</p> : null}
          <h3 className="hp-hover-preview-title">{preview.title}</h3>
        </div>
      </article>
    </div>
  );
}
