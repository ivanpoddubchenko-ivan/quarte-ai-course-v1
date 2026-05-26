import { useState } from 'react';

export default function PromptLibrary({ lib, accentColor }) {
  if (!lib?.length) return null;
  return (
    <section className="section">
      <div className="section-label">Prompt Library</div>
      <p className="plib-note">
        Натисни на картку → скопіюй → заміни [плейсхолдери] → запусти в Claude Project.
      </p>
      <div className="plib">
        {lib.map((item, i) => (
          <PromptCard key={i} item={item} accentColor={accentColor} />
        ))}
      </div>
    </section>
  );
}

function PromptCard({ item, accentColor }) {
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState(false);

  function copy(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(item.pr).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const catColor = item.col || accentColor || '#8b7cf8';

  return (
    <div className={`pcard${open ? ' open' : ''}`}>
      <button className="pcard-head" style={{ background: catColor + '18' }} onClick={() => setOpen(!open)}>
        <div>
          <span className="pcat" style={{ background: catColor + '28', color: catColor }}>{item.cat}</span>
          <div className="pname">{item.name}</div>
        </div>
        <span className="pcard-arrow" style={{ color: catColor }}>›</span>
      </button>
      {open && (
        <div className="pcard-body">
          <pre className="ppr">{item.pr}</pre>
          <div className="pcard-footer">
            <span className="pcard-hint">Заміни [плейсхолдери] на реальні дані</span>
            <button className={`copy-btn${copied ? ' ok' : ''}`} onClick={copy}>
              {copied ? 'Скопійовано ✓' : 'Копіювати'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
