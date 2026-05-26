export default function BadGoodExample({ bvg }) {
  if (!bvg) return null;
  return (
    <section className="section">
      <div className="section-label">Поганий vs хороший</div>
      <div className="bvg-grid">
        <div className="bvg-bad">
          <div className="bvg-label">Поганий промпт</div>
          <pre className="bvg-text">{bvg.bad}</pre>
          <div className="bvg-why">{bvg.whybad}</div>
        </div>
        <div className="bvg-good">
          <div className="bvg-label">Хороший промпт</div>
          <pre className="bvg-text">{bvg.good}</pre>
          <div className="bvg-why">{bvg.whygood}</div>
        </div>
      </div>
    </section>
  );
}
