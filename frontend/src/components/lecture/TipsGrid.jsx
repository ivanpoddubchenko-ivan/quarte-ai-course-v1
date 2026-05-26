export default function TipsGrid({ tips, bgColor }) {
  if (!tips?.length) return null;
  return (
    <section className="section">
      <div className="section-label">Tips &amp; Tricks</div>
      <div className="tips-grid">
        {tips.map((t, i) => (
          <div key={i} className="tip-card">
            <div className="tip-icon" style={{ background: bgColor }}>{t.icon}</div>
            <div>
              <div className="tip-name">{t.n}</div>
              <div className="tip-desc">{t.d}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
