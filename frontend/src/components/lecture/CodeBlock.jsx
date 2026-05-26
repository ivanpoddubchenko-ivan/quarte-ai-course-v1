import { useState } from 'react';

export default function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  function copy() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="section">
      <div className="section-label">Шаблон промпту / Команди</div>
      <div className="code-wrap">
        <div className="code-header">
          <span className="code-lang">prompt / code</span>
          <button className={`copy-btn${copied ? ' ok' : ''}`} onClick={copy}>
            {copied ? 'Скопійовано ✓' : 'Копіювати'}
          </button>
        </div>
        <pre className="code-body">{code}</pre>
      </div>
    </section>
  );
}
