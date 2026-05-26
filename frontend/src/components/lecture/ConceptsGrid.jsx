export default function ConceptsGrid({ concepts }) {
  if (!concepts?.length) return null;
  return (
    <section className="section">
      <div className="section-label">Ключові концепції</div>
      <div className="concepts-grid">
        {concepts.map((c, i) => (
          <div key={i} className="concept-card">
            <div className="concept-name">{c.n}</div>
            <div className="concept-desc">{c.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
