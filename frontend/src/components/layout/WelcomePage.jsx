import courseData from '../../data/course.json';

const { modules, lectures } = courseData;

export default function WelcomePage({ onSelectModule }) {
  return (
    <div className="welcome">
      <div className="w-eyebrow">Курс · Claude веде · v3.0</div>
      <h1 className="w-title">
        AI-стек що<br /><em>змінює</em> як ти<br />створюєш продукти
      </h1>
      <p className="w-sub">
        {lectures.length} лекцій · {modules.length} модулів · LLM, Агенти, Claude, Vibe Coding,
        Figma MCP, Business Analysis — від брифу до живого продукту
      </p>
      <div className="modules-grid">
        {modules.map((mod) => {
          const cnt = lectures.filter((l) => l.moduleId === mod.id).length;
          return (
            <div key={mod.id} className="module-card" onClick={() => onSelectModule(mod.id)}>
              <div className="module-card-dot" style={{ background: mod.color }} />
              <div className="module-card-name">{mod.name}</div>
              <div className="module-card-meta">{cnt} лекцій · {mod.week}</div>
            </div>
          );
        })}
      </div>
      <button className="start-btn" onClick={() => onSelectModule(0)}>
        Почати навчання →
      </button>
    </div>
  );
}
