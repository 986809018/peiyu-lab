import { useEffect, useState } from "react";
import "./App.css";

type Language = "zh" | "en";

/** Single source of truth for which projects exist and in what order. */
const projectOrder = ["01", "02", "03"] as const;
type ProjectId = (typeof projectOrder)[number];

type DetailKey = "overview" | "goal" | "approach" | "progress";

type ProjectCopy = {
  symbol: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  status: string;
  detail: Record<DetailKey, string>;
};

type Copy = {
  /** Value applied to <html lang> so assistive tech follows the switcher. */
  htmlLang: string;
  nav: { projects: string; about: string; contact: string };
  hero: {
    eyebrow: string;
    line1: string;
    line2: string;
    description: string;
    explore: string;
    about: string;
    meta1: string;
    meta2: string;
  };
  projectsSection: {
    kicker: string;
    title: string;
    /** Derived from the project list so the count can never drift. */
    count: (total: number) => string;
  };
  detailLabels: Record<DetailKey, string>;
  about: { kicker: string; title: string; description: string };
  footer: { contact: string; copyright: string };
  projects: Record<ProjectId, ProjectCopy>;
};

const translations = {
  zh: {
    htmlLang: "zh-CN",
    nav: { projects: "项目", about: "关于", contact: "联系我" },
    hero: {
      eyebrow: "个人技术实验室 · 持续探索中",
      line1: "一起探索技术，",
      line2: "让想法成为现实。",
      description: "探索 AI、编程与数字产品，把好奇心变成真正有用的东西。",
      explore: "探索项目",
      about: "关于 Peiyu Lab",
      meta1: "AI 辅助开发",
      meta2: "持续探索与创造",
    },
    projectsSection: {
      kicker: "正在探索的方向",
      title: "实验室项目",
      count: (total) => `${String(total).padStart(2, "0")} 个方向`,
    },
    detailLabels: {
      overview: "概述",
      goal: "目标",
      approach: "方法",
      progress: "当前进展",
    },
    about: {
      kicker: "关于这个空间",
      title: "保持好奇，动手创造。",
      description:
        "Peiyu Lab 是一个个人技术实验室，关注 AI、软件开发与数字产品。在这里，我探索新工具、尝试不同的解决思路，并把感兴趣的想法逐步变成真正有用的东西。",
    },
    footer: {
      contact: "打个招呼 ↗",
      copyright: "用好奇心构建。© 2026",
    },
    projects: {
      "01": {
        symbol: "✳",
        category: "AI 与自动化",
        title: "Personal AI Lab",
        description:
          "探索 AI 助手、智能体与自动化工作流，让日常数字生活更高效。",
        tags: ["AI 智能体", "OpenClaw", "自动化"],
        status: "持续探索中",
        detail: {
          overview: "探索如何让 AI 助手成为日常数字任务中的实用伙伴。",
          goal: "减少重复劳动，让信息、工具与工作流程更容易使用。",
          approach:
            "尝试不同的 AI 模型、智能体能力和自动化方案，并通过实际使用不断优化。",
          progress: "持续探索实用场景，完善值得长期使用的工作流。",
        },
      },
      "02": {
        symbol: "⌘",
        category: "AI 辅助开发",
        title: "Dev Workflow",
        description:
          "探索 AI 编程工具与现代开发流程，把想法更高效地转化为可用软件。",
        tags: ["React", "TypeScript", "AI 编程"],
        status: "持续实践中",
        detail: {
          overview: "探索将实际编码与 AI 辅助问题解决相结合的开发方式。",
          goal: "缩短从想法到可运行原型的距离，同时兼顾代码质量与理解。",
          approach:
            "尝试 AI 编程助手、结构化任务描述、迭代调试和现代前端工具。",
          progress: "比较不同工作流，寻找 AI 辅助最有价值的环节。",
        },
      },
      "03": {
        symbol: "◈",
        category: "个人数字产品",
        title: "Family Memories",
        description:
          "构想一个私密的数字空间，用于保存家庭照片、整理回忆和记录时间线。",
        tags: ["私人空间", "记忆整理", "AI"],
        status: "规划中",
        detail: {
          overview: "规划一个整合照片、个人回忆和时间线的私人家庭空间。",
          goal: "让家庭记忆更容易整理、回顾和长期保存。",
          approach:
            "围绕照片集合、时间线和可选的 AI 辅助整理，设计重视隐私的体验。",
          progress: "正在明确产品范围，并确定第一批实用功能。",
        },
      },
    },
  },
  en: {
    htmlLang: "en",
    nav: { projects: "Projects", about: "About", contact: "Get in touch" },
    hero: {
      eyebrow: "PERSONAL TECH LAB · ALWAYS EXPLORING",
      line1: "Ideas into",
      line2: "something real.",
      description:
        "Exploring AI, coding, and digital products — turning curiosity into something useful.",
      explore: "Explore projects",
      about: "About Peiyu Lab",
      meta1: "AI-ENHANCED DEVELOPMENT",
      meta2: "ALWAYS EXPLORING",
    },
    projectsSection: {
      kicker: "WHAT I'M EXPLORING",
      title: "Inside the lab",
      count: (total) => `${String(total).padStart(2, "0")} AREAS`,
    },
    detailLabels: {
      overview: "OVERVIEW",
      goal: "GOAL",
      approach: "APPROACH",
      progress: "CURRENT PROGRESS",
    },
    about: {
      kicker: "A LITTLE ABOUT THIS SPACE",
      title: "Stay curious. Build things.",
      description:
        "Peiyu Lab is a personal technology space focused on AI, software development, and digital products. I explore new tools, experiment with different approaches, and turn interesting ideas into useful things.",
    },
    footer: {
      contact: "Say hello ↗",
      copyright: "Built with curiosity. © 2026",
    },
    projects: {
      "01": {
        symbol: "✳",
        category: "AI & AUTOMATION",
        title: "Personal AI Lab",
        description:
          "Exploring AI assistants, intelligent agents, and workflows that make everyday digital life more efficient.",
        tags: ["AI Agents", "OpenClaw", "Automation"],
        status: "ACTIVE EXPLORATION",
        detail: {
          overview:
            "Exploring how AI assistants can become practical companions for everyday digital tasks.",
          goal: "Reduce repetitive work and make information, tools, and workflows easier to access.",
          approach:
            "Experimenting with AI models, agent capabilities, and automation workflows, then refining them through real-world use.",
          progress:
            "Exploring practical use cases and refining the workflows worth keeping.",
        },
      },
      "02": {
        symbol: "⌘",
        category: "AI-POWERED DEVELOPMENT",
        title: "Dev Workflow",
        description:
          "Experimenting with AI coding tools and modern development workflows to turn ideas into useful software.",
        tags: ["React", "TypeScript", "AI Coding"],
        status: "ONGOING",
        detail: {
          overview:
            "An evolving workflow combining hands-on coding with AI-assisted problem solving.",
          goal: "Shorten the path from an idea to a working prototype without sacrificing code quality or understanding.",
          approach:
            "Exploring AI coding assistants, structured task descriptions, iterative debugging, and modern front-end tools.",
          progress:
            "Testing different workflows and identifying where AI assistance provides the most value.",
        },
      },
      "03": {
        symbol: "◈",
        category: "PERSONAL PRODUCT",
        title: "Family Memories",
        description:
          "Designing a private digital space to preserve family photos, organize memories, and revisit meaningful moments.",
        tags: ["Private Space", "Memory", "AI"],
        status: "IN PLANNING",
        detail: {
          overview:
            "A concept for a private family space bringing photos, memories, and timelines together.",
          goal: "Make family memories easier to organize, revisit, and preserve over time.",
          approach:
            "Planning a privacy-conscious experience around photo collections, timelines, and optional AI-assisted organization.",
          progress:
            "Defining the product scope and prioritizing the first useful features.",
        },
      },
    },
  },
} satisfies Record<Language, Copy>;

const STORAGE_KEY = "peiyu-language";
const CONTACT_EMAIL = "hello@peiyulab.top";

function readStoredLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "zh";
  } catch {
    // Storage can be unavailable (private mode, blocked cookies): fall back.
    return "zh";
  }
}

function App() {
  const [expandedProject, setExpandedProject] = useState<ProjectId | null>(null);
  const [language, setLanguage] = useState<Language>(readStoredLanguage);

  const copy = translations[language];
  const detailFields = Object.keys(copy.detailLabels) as DetailKey[];

  useEffect(() => {
    document.documentElement.lang = copy.htmlLang;

    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Persisting the preference is best-effort only.
    }
  }, [language, copy.htmlLang]);

  return (
    <main className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="#home" aria-label="Peiyu Lab home">
          <span className="brand-mark">P.</span>
          <span>
            PEIYU <span className="brand-light">LAB</span>
          </span>
        </a>

        <nav className="navigation">
          <a href="#projects">{copy.nav.projects}</a>
          <a href="#about">{copy.nav.about}</a>

          <button
            type="button"
            className="language-toggle"
            aria-label={language === "zh" ? "Switch to English" : "切换到中文"}
            onClick={() =>
              setLanguage((current) => (current === "zh" ? "en" : "zh"))
            }
          >
            <span className={language === "zh" ? "language-active" : ""}>中</span>
            <span className="language-divider">/</span>
            <span className={language === "en" ? "language-active" : ""}>EN</span>
          </button>

          <a className="nav-contact" href={`mailto:${CONTACT_EMAIL}`}>
            {copy.nav.contact} <span>↗</span>
          </a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="eyebrow">
          <span className="status-dot" />
          {copy.hero.eyebrow}
        </div>

        <h1>
          {copy.hero.line1}
          <br />
          <span className="gradient-text">{copy.hero.line2}</span>
        </h1>

        <p className="hero-description">{copy.hero.description}</p>

        <div className="hero-actions">
          <a className="button-primary" href="#projects">
            {copy.hero.explore}
            <span>↘</span>
          </a>
          <a className="button-secondary" href="#about">
            {copy.hero.about}
          </a>
        </div>

        <div className="hero-meta">
          <span>{copy.hero.meta1}</span>
          <span className="meta-divider" />
          <span>{copy.hero.meta2}</span>
        </div>

        <div className="orbit orbit-large" />
        <div className="orbit orbit-small" />
        <div className="orb-core">
          <span>Py</span>
        </div>
      </section>

      <section className="projects-section" id="projects">
        <div className="section-heading">
          <div>
            <span className="section-kicker">{copy.projectsSection.kicker}</span>
            <h2>{copy.projectsSection.title}</h2>
          </div>
          <span className="section-count">
            {copy.projectsSection.count(projectOrder.length)}
          </span>
        </div>

        <div className="project-grid">
          {projectOrder.map((id) => {
            const project = copy.projects[id];
            const isExpanded = expandedProject === id;
            const detailId = `project-detail-${id}`;

            return (
              <article
                className={`project-card${isExpanded ? " is-expanded" : ""}`}
                key={id}
              >
                <button
                  type="button"
                  className="project-toggle"
                  aria-expanded={isExpanded}
                  aria-controls={detailId}
                  onClick={() => setExpandedProject(isExpanded ? null : id)}
                >
                  <span
                    className={`project-art project-art-${id}`}
                    aria-hidden="true"
                  >
                    <span className="art-orbit art-orbit-one" />
                    <span className="art-orbit art-orbit-two" />
                    <span className="art-core" />
                    <span className="art-spark art-spark-one" />
                    <span className="art-spark art-spark-two" />
                    <span className="art-spark art-spark-three" />
                    <span className="art-caption">{id} / PEIYU LAB</span>
                  </span>

                  <span className="card-topline">
                    <span className="card-number">{id}</span>
                    <span className="card-symbol" aria-hidden="true">
                      {project.symbol}
                    </span>
                  </span>

                  <span className="card-category">{project.category}</span>
                  <span className="project-card-title">{project.title}</span>
                  <span className="project-card-description">
                    {project.description}
                  </span>

                  <span className="tag-list">
                    {project.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </span>

                  <span className="card-bottom">
                    <span>{project.status}</span>
                    <span className="card-arrow" aria-hidden="true">
                      {isExpanded ? "↙" : "↗"}
                    </span>
                  </span>
                </button>

                {isExpanded && (
                  <div className="project-detail" id={detailId}>
                    <div className="detail-divider" />

                    {detailFields.map((key) => (
                      <div className="detail-item" key={key}>
                        <span className="detail-label">
                          {copy.detailLabels[key]}
                        </span>
                        <p>{project.detail[key]}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-mark" aria-hidden="true">
          P<span>.</span>
        </div>
        <div className="about-copy">
          <span className="section-kicker">{copy.about.kicker}</span>
          <h2>{copy.about.title}</h2>
          <p>{copy.about.description}</p>
        </div>
      </section>

      <footer className="footer">
        <a className="footer-brand" href="#home">
          PEIYU LAB<span>.</span>
        </a>
        <span>{copy.footer.copyright}</span>
        <a href={`mailto:${CONTACT_EMAIL}`}>{copy.footer.contact}</a>
      </footer>
    </main>
  );
}

export default App;
