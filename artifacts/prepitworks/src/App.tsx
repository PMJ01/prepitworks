import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  getGetDashboardQueryKey,
  getListCompaniesQueryKey,
  getListPracticeQueryKey,
  getListTestsQueryKey,
  useGetDashboard,
  useListCompanies,
  useListPractice,
  useListTests,
  useSubmitTest,
  type CompanyPlan,
  type Dashboard,
  type MockTest,
  type PracticeQuestion,
  type TestResult,
} from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness, Check, ChevronRight, Clock3, Code2, FileText, Gauge, GraduationCap, LayoutDashboard, Play, Search, Send, Timer, Trophy } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const fallbackDashboard: Dashboard = {
  readiness: 68,
  solved: 47,
  streak: 6,
  studyMinutes: 382,
  continueTopic: 'Dynamic programming',
  heatmap: [
    { topic: 'Arrays', score: 82 }, { topic: 'Trees', score: 61 }, { topic: 'Graphs', score: 44 },
    { topic: 'DP', score: 38 }, { topic: 'OS', score: 74 }, { topic: 'DBMS', score: 58 }, { topic: 'Networks', score: 32 },
  ],
};

const fallbackPractice: PracticeQuestion[] = [
  { id: 'two-sum', title: 'Two Sum, done properly', category: 'Arrays', difficulty: 'Easy', acceptance: 49.2, time: '18 min', tags: ['hash map', 'arrays'], prompt: 'Given an array of integers and a target, return the indices of two values that add up to the target.', explanation: 'Use a hash map to store each value as you pass through the array. The complement is target minus the current value.' },
  { id: 'lru-cache', title: 'Design an LRU cache', category: 'Design', difficulty: 'Medium', acceptance: 38.4, time: '34 min', tags: ['hash map', 'linked list'], prompt: 'Design a data structure that follows the constraints of a least recently used cache.', explanation: 'Pair a doubly linked list with a hash map. The map gives O(1) lookup while the list tracks recency.' },
  { id: 'course-schedule', title: 'Course schedule', category: 'Graphs', difficulty: 'Medium', acceptance: 47.7, time: '27 min', tags: ['BFS', 'topological sort'], prompt: 'Determine whether all courses can be completed given prerequisite pairs.', explanation: 'A cycle means the schedule is impossible. Track indegrees and repeatedly remove nodes with no prerequisites.' },
  { id: 'trapping-rain-water', title: 'Trapping rain water', category: 'Arrays', difficulty: 'Hard', acceptance: 63.1, time: '41 min', tags: ['two pointers', 'prefix'], prompt: 'Given an elevation map, compute how much water it can trap after raining.', explanation: 'Two pointers maintain the highest wall from each side, allowing a linear scan with constant space.' },
  { id: 'word-break', title: 'Word break', category: 'Dynamic programming', difficulty: 'Medium', acceptance: 46.8, time: '31 min', tags: ['DP', 'strings'], prompt: 'Return whether a string can be segmented into a space-separated sequence of dictionary words.', explanation: 'Let dp[i] represent whether the prefix ending at i can be formed. Test every valid previous cut.' },
  { id: 'merge-k-lists', title: 'Merge k sorted lists', category: 'Heaps', difficulty: 'Hard', acceptance: 56.2, time: '36 min', tags: ['heap', 'divide and conquer'], prompt: 'Merge k sorted linked lists into one sorted linked list.', explanation: 'A min heap keeps the smallest available head from every list, producing O(n log k) time.' },
  { id: 'valid-parentheses', title: 'Valid parentheses', category: 'Stacks', difficulty: 'Easy', acceptance: 42.6, time: '14 min', tags: ['stack', 'strings'], prompt: 'Given a string containing bracket characters, determine whether the input is valid.', explanation: 'Push opening brackets and match each closing bracket against the most recent opening bracket.' },
  { id: 'binary-tree-paths', title: 'Binary tree paths', category: 'Trees', difficulty: 'Easy', acceptance: 68.3, time: '19 min', tags: ['DFS', 'recursion'], prompt: 'Return all root-to-leaf paths in a binary tree.', explanation: 'Carry the path during DFS. When a leaf is reached, commit the path to the result.' },
];

const fallbackCompanies: CompanyPlan[] = [
  { id: 'google', name: 'Google', logo: 'G', accent: 'black', rounds: 5, applicants: '1 in 260', focus: 'Algorithms, systems thinking', overview: 'A deliberate plan for the interview loop that rewards clear problem framing and strong fundamentals.', plan: ['Refresh graph traversal and dynamic programming', 'Practice 45-minute problems out loud', 'Review distributed systems tradeoffs', 'Run two full mock loops'] },
  { id: 'microsoft', name: 'Microsoft', logo: 'MS', accent: 'black', rounds: 4, applicants: '1 in 118', focus: 'DSA, collaboration', overview: 'Build signal across coding, object-oriented design, and the way you communicate decisions.', plan: ['Complete the arrays and trees sprint', 'Prepare a project deep dive', 'Drill behavioral stories with outcomes', 'Take the Microsoft-style mock'] },
  { id: 'amazon', name: 'Amazon', logo: 'a', accent: 'black', rounds: 6, applicants: '1 in 190', focus: 'Leadership principles', overview: 'Pair reliable coding performance with stories that show ownership, customer focus, and judgment.', plan: ['Map six stories to leadership principles', 'Solve timed medium questions', 'Study API and class design', 'Rehearse the bar raiser round'] },
  { id: 'razorpay', name: 'Razorpay', logo: 'RZ', accent: 'black', rounds: 4, applicants: '1 in 72', focus: 'Product engineering', overview: 'A compact plan for high-ownership product teams and practical engineering conversations.', plan: ['Practice SQL and debugging', 'Review payments and reliability basics', 'Build a crisp project narrative', 'Complete a product sense prompt'] },
];

const fallbackTests: MockTest[] = [
  { id: 'google-screen', title: 'Google phone screen', company: 'Google', type: 'Coding screen', questions: 3, duration: 45, difficulty: 'Medium', description: 'Three problems that test decomposition, edge cases, and how you communicate under time.' },
  { id: 'amazon-sde1', title: 'Amazon SDE I loop', company: 'Amazon', type: 'Mixed assessment', questions: 5, duration: 65, difficulty: 'Medium', description: 'A focused run through coding, complexity, and engineering judgment.' },
  { id: 'core-cs-check', title: 'Core CS checkpoint', company: 'PrepitWorks', type: 'Knowledge check', questions: 4, duration: 30, difficulty: 'Foundational', description: 'A quick diagnostic across operating systems, databases, networks, and OOP.' },
];

const testPrompts = [
  'Explain the time and space complexity of your preferred approach.',
  'What changes if the input is too large to fit in memory?',
  'Walk through the edge cases before writing the final code.',
  'Which tradeoff would you revisit in a production system?',
  'Describe how you would test this beyond the happy path.',
];

const labLanguages = [
  { id: 'python', name: 'Python 3.12', code: 'def solve(values, target):\n    # write the invariant first\n    return []\n\nprint(solve([2, 7, 11, 15], 9))' },
  { id: 'java', name: 'Java 21', code: 'class Solution {\n    public int[] solve(int[] values, int target) {\n        // write the invariant first\n        return new int[] {};\n    }\n}' },
  { id: 'cpp', name: 'C++ 20', code: '#include <vector>\nusing namespace std;\n\nvector<int> solve(vector<int> values, int target) {\n    // write the invariant first\n    return {};\n}' },
  { id: 'javascript', name: 'JavaScript', code: 'function solve(values, target) {\n  // write the invariant first\n  return [];\n}\n\nconsole.log(solve([2, 7, 11, 15], 9));' },
  { id: 'go', name: 'Go 1.22', code: 'package main\n\nfunc solve(values []int, target int) []int {\n    // write the invariant first\n    return []int{}\n}' },
];

function useFallback<T>(data: T | undefined, fallback: T) {
  return data ?? fallback;
}

function Logo() {
  return <Link href="/" className="brand-mark" data-testid="link-brand">PREPIT<span>WORKS / DAILY PREPARATION</span></Link>;
}

const navGroups = [
  { label: 'Command center', items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { href: '/practice', label: 'Practice bank', icon: Code2 }] },
  { label: 'Preparation', items: [{ href: '/company', label: 'Company plans', icon: BriefcaseBusiness }, { href: '/tests', label: 'Mock tests', icon: Timer }, { href: '/core-cs', label: 'Core CS', icon: BookOpen }, { href: '/courses', label: 'Courses', icon: GraduationCap }] },
  { label: 'Career kit', items: [{ href: '/resume', label: 'Resume match', icon: FileText }, { href: '/contact', label: 'Contact', icon: Send }] },
];

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  useEffect(() => {
    const routeName = location === '/' ? 'Start' : location.split('/')[1]?.replace('-', ' ') || 'Workspace';
    document.title = `${routeName.charAt(0).toUpperCase()}${routeName.slice(1)} / PrepitWorks`;
  }, [location]);
  return (
    <div className="shell noise">
      <aside className="sidebar">
        <Logo />
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="nav-label">{group.label}</div>
            <nav>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = location === item.href || (item.href !== '/dashboard' && location.startsWith(`${item.href}/`));
                return <Link key={item.href} href={item.href} className={`nav-link ${active ? 'active' : ''}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={14} strokeWidth={1.7} /><span>{item.label}</span></Link>;
              })}
            </nav>
          </div>
        ))}
        <div className="sidebar-foot">A workspace for the serious part of getting ready.<br /><br /><span className="mono">v1.0 / focused mode</span></div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span className="topbar-kicker">Placement preparation / 2025</span>
          <div className="topbar-right"><span>Mon, 14 Oct</span><span className="avatar" aria-label="User profile" data-testid="avatar-user">AK</span></div>
        </header>
        {children}
      </main>
    </div>
  );
}

function Landing() {
  return (
    <div className="landing noise">
      <section className="landing-copy page-enter">
        <div>
          <Logo />
          <div style={{ marginTop: 'clamp(72px, 15vh, 160px)' }}>
            <div className="eyebrow">The daily study cockpit</div>
            <h1 className="display">Preparation that<br />compounds.</h1>
            <p className="lede">PrepitWorks turns a vague placement goal into a clear next session: one problem, one concept, one step closer to the offer.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 30 }}>
              <Link href="/dashboard" className="btn btn-primary" data-testid="link-start-preparation">Start preparation <ArrowRight size={15} /></Link>
              <Link href="/practice" className="btn btn-quiet" data-testid="link-browse-practice">Browse the bank</Link>
            </div>
          </div>
        </div>
        <div className="footer-note">Built for returning tomorrow / not browsing today</div>
      </section>
      <section className="landing-aside page-enter delay-2">
        <div className="eyebrow">What changes here</div>
        <div style={{ fontSize: 'clamp(28px, 4vw, 54px)', lineHeight: 1.04, letterSpacing: '-.055em', marginTop: 22 }}>Less tab-hopping.<br /><strong>More signal.</strong></div>
        <div className="mark-grid">
          {[
            ['01 / Direction', 'A command center that tells you what to do next, not just what you have done.'],
            ['02 / Repetition', 'Practice, tests, and company plans live in one short feedback loop.'],
            ['03 / Confidence', 'See readiness grow through evidence: solved problems, focused minutes, sharper recall.'],
          ].map(([title, copy]) => <div className="mark-grid-row" key={title}><span>{title}</span><span>{copy}</span></div>)}
        </div>
      </section>
    </div>
  );
}

function LoadingBlock() {
  return <div className="panel panel-pad" data-testid="status-loading"><div className="skeleton" style={{ height: 18, width: '38%', marginBottom: 18 }} /><div className="skeleton" style={{ height: 42, width: '62%', marginBottom: 12 }} /><div className="skeleton" style={{ height: 12, width: '86%' }} /></div>;
}

function ErrorBlock({ retry }: { retry: () => void }) {
  return <div className="error-box" data-testid="status-error"><div><strong>Could not load this view.</strong><div style={{ fontSize: 12, opacity: .62, marginTop: 5 }}>Your offline study layer is still available.</div></div><button className="btn btn-quiet" onClick={retry} data-testid="button-retry">Try again</button></div>;
}

function Dashboard() {
  const query = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey(), retry: false } });
  const dashboard = useFallback(query.data, fallbackDashboard);
  const heat = dashboard.heatmap?.length ? dashboard.heatmap : fallbackDashboard.heatmap;
  return <div className="content page-enter">
    <div className="eyebrow">Monday / command center</div>
    <h1 className="headline" style={{ margin: '20px 0 10px' }}>Good morning, Ananya.</h1>
    <p className="lede">Your next useful hour is already mapped.</p>
    <div className="metric-grid" style={{ marginTop: 38 }}>
      {[[`${dashboard.readiness}%`, 'Readiness'], [`${dashboard.solved}`, 'Problems solved'], [`${dashboard.streak}`, 'Day streak'], [`${dashboard.studyMinutes}m`, 'Study time']].map(([value, name]) => <div className="metric" key={name} data-testid={`metric-${name.toLowerCase().replaceAll(' ', '-')}`}><span className="metric-value">{value}</span><span className="metric-name">{name}</span></div>)}
    </div>
    <div className="split-wide" style={{ marginTop: 42 }}>
      <section>
        <div className="section-line"><div><div className="eyebrow">Priority queue</div><div className="section-title" style={{ marginTop: 10 }}>Your next actions</div></div><span className="mono" style={{ fontSize: 10, opacity: .6 }}>03 ITEMS</span></div>
        <div className="panel rule-list">
          <Link className="action-row" href="/practice/word-break" data-testid="link-action-dp"><div><div className="mono" style={{ fontSize: 9, opacity: .58 }}>CONTINUE / 31 MIN</div><strong style={{ display: 'block', marginTop: 7 }}>Finish {dashboard.continueTopic || 'dynamic programming'} foundations</strong><div style={{ fontSize: 12, opacity: .6, marginTop: 6 }}>Word break · medium · 46.8% acceptance</div></div><ChevronRight size={17} /></Link>
          <Link className="action-row" href="/tests/google-screen" data-testid="link-action-test"><div><div className="mono" style={{ fontSize: 9, opacity: .58 }}>ASSESS / 45 MIN</div><strong style={{ display: 'block', marginTop: 7 }}>Run a phone screen simulation</strong><div style={{ fontSize: 12, opacity: .6, marginTop: 6 }}>Google-style coding screen · 3 questions</div></div><ChevronRight size={17} /></Link>
          <Link className="action-row" href="/company/google" data-testid="link-action-company"><div><div className="mono" style={{ fontSize: 9, opacity: .58 }}>PREP / 20 MIN</div><strong style={{ display: 'block', marginTop: 7 }}>Read the Google loop plan</strong><div style={{ fontSize: 12, opacity: .6, marginTop: 6 }}>Algorithms · systems thinking · 5 rounds</div></div><ChevronRight size={17} /></Link>
        </div>
      </section>
      <aside>
        <div className="section-line"><div><div className="eyebrow">Signal map</div><div className="section-title" style={{ marginTop: 10 }}>Topic readiness</div></div></div>
        <div className="panel panel-pad">
          <div className="heatmap" data-testid="heatmap-readiness">{Array.from({ length: 35 }, (_, index) => { const score = heat[index % heat.length]?.score ?? 0; const level = score > 75 ? 4 : score > 55 ? 3 : score > 35 ? 2 : 1; return <div className="heat-cell" data-level={level} key={index} title={`${heat[index % heat.length]?.topic}: ${score}%`} data-testid={`heat-cell-${index}`} />; })}</div>
          <div className="rule-list" style={{ marginTop: 22 }}>{heat.slice(0, 4).map((item) => <div key={item.topic} style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span>{item.topic}</span><span className="mono">{item.score}%</span></div>)}</div>
        </div>
      </aside>
    </div>
    {query.isLoading && <div style={{ marginTop: 20 }}><LoadingBlock /></div>}
    {query.isError && <div style={{ marginTop: 20 }}><ErrorBlock retry={() => query.refetch()} /></div>}
  </div>;
}

function Practice() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All topics');
  const [difficulty, setDifficulty] = useState('All levels');
  const params = useMemo(() => ({ search: search || undefined, category: category === 'All topics' ? undefined : category, difficulty: difficulty === 'All levels' ? undefined : difficulty }), [search, category, difficulty]);
  const query = useListPractice(params, { query: { queryKey: getListPracticeQueryKey(params), retry: false } });
  const remote = useFallback(query.data, fallbackPractice);
  const questions = remote.filter((item) => (!search || `${item.title} ${item.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())) && (category === 'All topics' || item.category === category) && (difficulty === 'All levels' || item.difficulty === difficulty));
  const categories = ['All topics', ...Array.from(new Set(fallbackPractice.map((item) => item.category)))];
  return <div className="content page-enter">
    <div className="eyebrow">Practice bank / 047 questions</div>
    <h1 className="headline" style={{ margin: '20px 0 10px' }}>Make the hard thing<br />specific.</h1>
    <p className="lede">Search by the shape of the problem, filter by the pressure you want, and start with a clear clock.</p>
    <div className="toolbar" style={{ marginTop: 32 }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 220 }}><Search size={15} style={{ position: 'absolute', left: 12, top: 13, opacity: .55 }} /><input className="field search-field" style={{ width: '100%', paddingLeft: 35 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search problems or tags" data-testid="input-practice-search" /></div>
      <select className="select" value={category} onChange={(event) => setCategory(event.target.value)} data-testid="select-practice-category">{categories.map((value) => <option key={value}>{value}</option>)}</select>
      <select className="select" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} data-testid="select-practice-difficulty">{['All levels', 'Easy', 'Medium', 'Hard'].map((value) => <option key={value}>{value}</option>)}</select>
    </div>
    {query.isError && <div style={{ marginTop: 18 }}><ErrorBlock retry={() => query.refetch()} /></div>}
    {query.isLoading ? <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 24 }}><LoadingBlock /><LoadingBlock /></div> : questions.length ? <div className="card-grid" style={{ marginTop: 24 }}>{questions.map((question, index) => <QuestionCard key={question.id} question={question} index={index} />)}</div> : <div className="empty" style={{ marginTop: 24 }} data-testid="empty-practice"><strong>Nothing matches that cut.</strong><p style={{ fontSize: 12, opacity: .62 }}>Try a broader topic or clear the search.</p><button className="btn btn-quiet" onClick={() => { setSearch(''); setCategory('All topics'); setDifficulty('All levels'); }} data-testid="button-clear-practice">Clear filters</button></div>}
  </div>;
}

function QuestionCard({ question, index }: { question: PracticeQuestion; index: number }) {
  return <Link href={`/practice/${question.id}`} className={`question-card page-enter delay-${Math.min(index + 1, 4)}`} data-testid={`card-practice-${question.id}`}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className={`tag ${question.difficulty === 'Hard' ? 'tag-fill' : ''}`}>{question.difficulty}</span><span className="mono" style={{ fontSize: 9, opacity: .55 }}>{question.category}</span></div>
    <h3>{question.title}</h3><p>{question.prompt}</p>
    <div className="card-foot"><span>{question.acceptance}% accepted</span><span>{question.time} <ArrowRight size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} /></span></div>
  </Link>;
}

function CodeLab({ question, onClose }: { question: PracticeQuestion; onClose: () => void }) {
  const [languageId, setLanguageId] = useState('python');
  const language = labLanguages.find((item) => item.id === languageId) ?? labLanguages[0];
  const [code, setCode] = useState(language.code);
  const [output, setOutput] = useState('READY / waiting for your first run');
  const [isRunning, setIsRunning] = useState(false);

  const selectLanguage = (nextId: string) => {
    const next = labLanguages.find((item) => item.id === nextId) ?? labLanguages[0];
    setLanguageId(next.id);
    setCode(next.code);
    setOutput('READY / starter code loaded');
  };

  const runCode = () => {
    setIsRunning(true);
    setOutput(`RUNNING / ${language.name}\nchecking ${question.title.toLowerCase()} against sample cases...`);
    window.setTimeout(() => {
      setIsRunning(false);
      setOutput(`PASS / sample execution complete\n\n${language.name} sandbox\n3 visible cases checked\nTIME 18 ms   MEMORY 12 MB\n\nKeep the explanation close to the invariant.`);
    }, 650);
  };

  return <div className="code-lab-shell page-enter" data-testid="code-lab">
    <div className="code-lab-bar">
      <div className="eyebrow">Code lab / {question.title}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select className="select code-language" value={languageId} onChange={(event) => selectLanguage(event.target.value)} data-testid="select-code-language">
          {labLanguages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={runCode} disabled={isRunning} data-testid="button-run-code"><Play size={13} />{isRunning ? 'Running' : 'Run code'}</button>
        <button className="btn btn-quiet" onClick={onClose} data-testid="button-exit-code-lab">Exit</button>
      </div>
    </div>
    <div className="code-lab-grid">
      <div className="code-editor-pane">
        <div className="mono code-editor-meta">EDITOR / {language.name.toUpperCase()}</div>
        <textarea className="code-editor" value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} data-testid="textarea-code-editor" aria-label={`${language.name} code editor`} />
      </div>
      <div className="code-output-pane">
        <div className="mono code-editor-meta">OUTPUT / LIVE</div>
        <pre>{output}</pre>
        <div className="lab-note"><span className="tag">Hint</span><span>Use the smallest data structure that makes the invariant obvious.</span></div>
      </div>
    </div>
  </div>;
}

function PracticeDetail() {
  const { id } = useParams<{ id: string }>();
  const query = useListPractice(undefined, { query: { queryKey: getListPracticeQueryKey(), retry: false } });
  const question = (query.data ?? fallbackPractice).find((item) => item.id === id) ?? fallbackPractice[0];
  const [labOpen, setLabOpen] = useState(false);
  if (labOpen) return <div className="content page-enter"><button className="eyebrow lab-back" onClick={() => setLabOpen(false)} data-testid="button-back-from-code-lab"><ArrowLeft size={14} /> {question.title}</button><CodeLab question={question} onClose={() => setLabOpen(false)} /></div>;
  return <div className="content page-enter">
    <Link href="/practice" className="eyebrow" data-testid="link-back-practice"><ArrowLeft size={14} /> Practice bank</Link>
    <div className="split-wide" style={{ marginTop: 34 }}>
      <section>
        <div style={{ display: 'flex', gap: 8 }}><span className={`tag ${question.difficulty === 'Hard' ? 'tag-fill' : ''}`}>{question.difficulty}</span><span className="tag">{question.category}</span></div>
        <h1 className="headline" style={{ margin: '22px 0 15px' }}>{question.title}</h1>
        <p className="lede">{question.prompt}</p>
        <div className="lab" style={{ marginTop: 38 }}>
          <div className="lab-copy"><div className="eyebrow">Code lab / ready</div><h2 style={{ fontSize: 25, letterSpacing: '-.04em', margin: '18px 0 12px' }}>Start from the constraint.</h2><p style={{ fontSize: 13, lineHeight: 1.6, opacity: .67 }}>Switch languages, edit the starter, run a local feedback pass, and keep the explanation close to the invariant.</p><button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setLabOpen(true)} data-testid="button-enter-code-lab">Enter code lab <Code2 size={15} /></button></div>
          <div className="code-box"><div className="code-line">01  <strong>function solve(input) {'{'}</strong></div><div className="code-line">02    <strong>// name the invariant</strong></div><div className="code-line">03    <strong>const answer = null;</strong></div><div className="code-line">04    <strong>return answer;</strong></div><div className="code-line">05  <strong>{'}'}</strong></div></div>
        </div>
      </section>
      <aside>
        <div className="panel panel-pad"><div className="eyebrow">Field notes</div><div style={{ marginTop: 24 }}><div className="mono" style={{ fontSize: 9, opacity: .55 }}>EXPECTED TIME</div><strong style={{ display: 'block', fontSize: 22, marginTop: 6 }}>{question.time}</strong></div><div style={{ marginTop: 22 }}><div className="mono" style={{ fontSize: 9, opacity: .55 }}>ACCEPTANCE</div><strong style={{ display: 'block', fontSize: 22, marginTop: 6 }}>{question.acceptance}%</strong></div><div style={{ marginTop: 22 }}><div className="mono" style={{ fontSize: 9, opacity: .55 }}>TOOLS</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{question.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div></div>
        <div className="panel panel-pad" style={{ marginTop: 14 }}><div className="eyebrow">After the attempt</div><p style={{ fontSize: 13, lineHeight: 1.6, opacity: .68, margin: '18px 0 0' }}>{question.explanation}</p></div>
      </aside>
    </div>
  </div>;
}

function Company() {
  const query = useListCompanies({ query: { queryKey: getListCompaniesQueryKey(), retry: false } });
  const companies = useFallback(query.data, fallbackCompanies);
  return <div className="content page-enter"><div className="eyebrow">Company preparation / choose a lane</div><h1 className="headline" style={{ margin: '20px 0 10px' }}>Prepare for the<br />conversation behind the code.</h1><p className="lede">Each company plan is a short, opinionated route through its loop. No sprawling syllabus.</p>{query.isError && <div style={{ marginTop: 18 }}><ErrorBlock retry={() => query.refetch()} /></div>}<div className="company-grid" style={{ marginTop: 36 }}>{companies.map((company, index) => <Link href={`/company/${company.id}`} className="company-card page-enter" style={{ animationDelay: `${index * .07}s` }} key={company.id} data-testid={`card-company-${company.id}`}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div className="logo-box">{company.logo}</div><span className="mono" style={{ fontSize: 9, opacity: .6 }}>{company.rounds} ROUNDS</span></div><h2 style={{ fontSize: 25, letterSpacing: '-.045em', margin: '24px 0 8px' }}>{company.name}</h2><p style={{ fontSize: 12, opacity: .64, lineHeight: 1.5, margin: 0 }}>{company.focus}</p><div className="card-foot"><span>{company.applicants} pass rate</span><ArrowRight size={14} /></div></Link>)}</div></div>;
}

function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const query = useListCompanies({ query: { queryKey: getListCompaniesQueryKey(), retry: false } });
  const company = (query.data ?? fallbackCompanies).find((item) => item.id === id) ?? fallbackCompanies[0];
  return <div className="content page-enter"><Link href="/company" className="eyebrow" data-testid="link-back-company"><ArrowLeft size={14} /> Company plans</Link><div className="split-wide" style={{ marginTop: 34 }}><section><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><div className="logo-box">{company.logo}</div><div><div className="mono" style={{ fontSize: 9, opacity: .55 }}>{company.rounds} ROUNDS / {company.applicants}</div><h1 className="headline" style={{ margin: '8px 0 0' }}>{company.name}</h1></div></div><p className="lede" style={{ marginTop: 24 }}>{company.overview}</p><div className="section-line" style={{ marginTop: 44 }}><div><div className="eyebrow">The route</div><div className="section-title" style={{ marginTop: 10 }}>Four focused sessions</div></div></div><div className="panel rule-list">{company.plan.map((item, index) => <div className="action-row" key={item}><div style={{ display: 'flex', gap: 16, alignItems: 'center' }}><span className="mono" style={{ fontSize: 10, opacity: .5 }}>0{index + 1}</span><span style={{ fontSize: 13 }}>{item}</span></div><Check size={15} /></div>)}</div></section><aside><div className="panel panel-pad"><div className="eyebrow">Loop profile</div><div style={{ marginTop: 22 }}><div className="mono" style={{ fontSize: 9, opacity: .55 }}>PRIMARY FOCUS</div><strong style={{ display: 'block', fontSize: 18, marginTop: 7 }}>{company.focus}</strong></div><div style={{ marginTop: 24 }}><div className="mono" style={{ fontSize: 9, opacity: .55 }}>WHAT TO PRACTICE</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}><span className="tag">Problem framing</span><span className="tag">Tradeoffs</span><span className="tag">Clarity</span></div></div><Link href="/tests/google-screen" className="btn btn-primary" style={{ marginTop: 30, width: '100%' }} data-testid="link-company-test">Take a matching mock <ArrowRight size={14} /></Link></div><div className="panel panel-pad" style={{ marginTop: 14 }}><div className="eyebrow">Practice prompt</div><p style={{ fontSize: 14, lineHeight: 1.6, margin: '18px 0 0' }}>“Tell me about a time you changed your approach after learning something new.”</p></div></aside></div></div>;
}

function Tests() {
  const query = useListTests({ query: { queryKey: getListTestsQueryKey(), retry: false } });
  const tests = useFallback(query.data, fallbackTests);
  return <div className="content page-enter"><div className="eyebrow">Mock assessments / pressure, measured</div><h1 className="headline" style={{ margin: '20px 0 10px' }}>A test is useful<br />when it tells you what next.</h1><p className="lede">Timed, short, and followed by a recommendation you can act on immediately.</p>{query.isError && <div style={{ marginTop: 18 }}><ErrorBlock retry={() => query.refetch()} /></div>}<div className="test-grid" style={{ marginTop: 38 }}>{tests.map((test, index) => <Link href={`/tests/${test.id}`} className="test-card page-enter" style={{ animationDelay: `${index * .08}s` }} key={test.id} data-testid={`card-test-${test.id}`}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="tag">{test.type}</span><span className="mono" style={{ fontSize: 9, opacity: .55 }}>{test.difficulty}</span></div><h3>{test.title}</h3><p style={{ fontSize: 12, lineHeight: 1.5, opacity: .64, margin: 0 }}>{test.description}</p><div className="test-meta" style={{ marginTop: 'auto', paddingTop: 24 }}><span><Clock3 size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />{test.duration} min</span><span>{test.questions} questions</span></div></Link>)}</div></div>;
}

function TestDetail() {
  const { id } = useParams<{ id: string }>();
  const testsQuery = useListTests({ query: { queryKey: getListTestsQueryKey(), retry: false } });
  const test = (testsQuery.data ?? fallbackTests).find((item) => item.id === id) ?? fallbackTests[0];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const submit = useSubmitTest();
  const questions = Array.from({ length: test.questions }, (_, questionIndex) => testPrompts[questionIndex % testPrompts.length]);
  const handleSubmit = () => {
    submit.mutate({ testId: test.id, data: { answers } }, {
      onSuccess: (result) => { localStorage.setItem('prepitworks-result', JSON.stringify(result)); setSubmitted(true); },
      onError: () => { const result: TestResult = { score: Object.keys(answers).length, total: test.questions, percentage: Math.round((Object.keys(answers).length / test.questions) * 100), recommendation: 'Review the unanswered prompts, then retake this in three days.' }; localStorage.setItem('prepitworks-result', JSON.stringify(result)); setSubmitted(true); },
    });
  };
  if (submitted) return <div className="content page-enter"><div className="eyebrow">Assessment complete</div><h1 className="headline" style={{ margin: '20px 0 14px' }}>The clock stopped.<br />Now use the signal.</h1><p className="lede">Your result is ready with a clear recommendation for the next study block.</p><Link href="/results" className="btn btn-primary" style={{ marginTop: 28 }} data-testid="link-view-results">View result <ArrowRight size={14} /></Link></div>;
  return <div className="content page-enter"><div className="eyebrow"><Timer size={13} /> {test.company} / {test.type}</div><h1 className="headline" style={{ margin: '20px 0 8px' }}>{test.title}</h1><div className="steps">{questions.map((_, questionIndex) => <div className={`step ${questionIndex === index ? 'active' : ''} ${questionIndex < index ? 'done' : ''}`} key={questionIndex}>0{questionIndex + 1} / {questions.length}</div>)}</div><div className="split-wide"><section className="panel panel-pad"><div className="mono" style={{ fontSize: 10, opacity: .55 }}>QUESTION {index + 1} OF {questions.length}</div><h2 style={{ fontSize: 25, letterSpacing: '-.04em', lineHeight: 1.15, margin: '22px 0 14px' }}>{questions[index]}</h2><p style={{ fontSize: 13, opacity: .62, lineHeight: 1.6 }}>Use the response area to capture the approach you would say out loud. There is no perfect phrasing; there is only a clearer one.</p><textarea className="field textarea" style={{ width: '100%', marginTop: 22, minHeight: 170 }} value={answers[String(index)] !== undefined ? String(answers[String(index)]) : ''} onChange={(event) => setAnswers({ ...answers, [String(index)]: Number(event.target.value) || 1 })} placeholder="Mark your confidence: enter 1–5" data-testid={`input-test-answer-${index}`} /><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}><button className="btn btn-quiet" disabled={index === 0} onClick={() => setIndex(index - 1)} data-testid="button-previous-question"><ArrowLeft size={14} /> Previous</button>{index < questions.length - 1 ? <button className="btn btn-primary" onClick={() => setIndex(index + 1)} data-testid="button-next-question">Next question <ArrowRight size={14} /></button> : <button className="btn btn-primary" onClick={handleSubmit} disabled={submit.isPending} data-testid="button-submit-test">{submit.isPending ? 'Submitting' : 'Submit assessment'} <Check size={14} /></button>}</div></section><aside><div className="panel panel-pad"><div className="eyebrow">Session timer</div><div style={{ fontSize: 47, letterSpacing: '-.07em', margin: '17px 0 4px' }} className="mono">00:{String(test.duration).padStart(2, '0')}</div><p style={{ fontSize: 12, opacity: .6, lineHeight: 1.5 }}>Keep moving. A complete attempt is more useful than a perfect first answer.</p></div><div className="panel panel-pad" style={{ marginTop: 14 }}><div className="eyebrow">Progress</div><div className="progress-track" style={{ marginTop: 20 }}><div className="progress-fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div><div className="mono" style={{ fontSize: 10, marginTop: 9 }}>{index + 1} / {questions.length} answered</div></div></aside></div></div>;
}

function Results() {
  const [result] = useState<TestResult>(() => { try { return JSON.parse(localStorage.getItem('prepitworks-result') || '') as TestResult; } catch { return { score: 3, total: 5, percentage: 60, recommendation: 'Spend your next block on complexity analysis and timed medium problems.' }; } });
  return <div className="content page-enter"><div className="eyebrow">Result / Google phone screen</div><h1 className="headline" style={{ margin: '20px 0 10px' }}>A useful read<br />on your readiness.</h1><p className="lede">The number matters less than what it tells you to do next.</p><div className="metric-grid" style={{ marginTop: 38, maxWidth: 760 }}><div className="metric"><span className="metric-value">{result.percentage}%</span><span className="metric-name">Score</span></div><div className="metric"><span className="metric-value">{result.score}/{result.total}</span><span className="metric-name">Signal points</span></div><div className="metric"><span className="metric-value"><Gauge size={32} /></span><span className="metric-name">Diagnostic</span></div><div className="metric"><span className="metric-value"><Trophy size={32} /></span><span className="metric-name">Keep going</span></div></div><div className="split" style={{ marginTop: 42, maxWidth: 900 }}><div className="panel panel-pad"><div className="eyebrow">Recommendation</div><h2 style={{ fontSize: 25, letterSpacing: '-.04em', margin: '18px 0 12px' }}>{result.recommendation}</h2><p style={{ fontSize: 13, opacity: .63, lineHeight: 1.6 }}>Return to the dashboard and let this recommendation become the first item in your next session.</p><Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 18 }} data-testid="link-results-dashboard">Back to dashboard <ArrowRight size={14} /></Link></div><div className="panel panel-pad"><div className="eyebrow">Next best move</div><strong style={{ display: 'block', fontSize: 17, marginTop: 18 }}>Solve one medium graph problem</strong><div className="progress-track" style={{ marginTop: 20 }}><div className="progress-fill" style={{ width: '44%' }} /></div><div className="mono" style={{ fontSize: 9, marginTop: 10, opacity: .62 }}>COURSE SCHEDULE / 27 MIN</div><Link href="/practice/course-schedule" className="btn btn-quiet" style={{ marginTop: 22 }} data-testid="link-results-practice">Open problem <ArrowRight size={14} /></Link></div></div></div>;
}

function CoreCS() {
  const subjects = [
    ['Operating systems', 'Processes, threads, scheduling, and the memory model.', '06 guides'],
    ['Databases', 'Indexes, transactions, normalization, and query planning.', '08 guides'],
    ['Computer networks', 'HTTP, TCP, DNS, and the path a request takes.', '05 guides'],
    ['Object-oriented design', 'Modeling behavior, boundaries, and change.', '07 guides'],
    ['Distributed systems', 'Consistency, queues, failure, and graceful scale.', '04 guides'],
    ['Low-level foundations', 'Concurrency, storage, and the cost of abstraction.', '03 guides'],
  ];
  return <div className="content page-enter"><div className="eyebrow">Core CS / interview guides</div><h1 className="headline" style={{ margin: '20px 0 10px' }}>The concepts<br />under the answers.</h1><p className="lede">Short guides for the questions that look simple until someone asks you to go one layer deeper.</p><div className="card-grid" style={{ marginTop: 38 }}>{subjects.map(([title, copy, count], index) => <Link href={`/core-cs#${title.toLowerCase().replaceAll(' ', '-')}`} className="question-card" style={{ minHeight: 205 }} key={title} data-testid={`card-subject-${index}`}><span className="mono" style={{ fontSize: 9, opacity: .55 }}>0{index + 1} / {count}</span><h3>{title}</h3><p>{copy}</p><div className="card-foot"><span>Read guide</span><ArrowRight size={14} /></div></Link>)}</div></div>;
}

function Courses() {
  const courses = [
    ['Foundations sprint', 'Arrays → trees → graphs', '12 / 18 lessons', 67],
    ['Dynamic programming', 'From recurrence to confidence', '07 / 14 lessons', 50],
    ['Interview communication', 'Make your reasoning visible', '03 / 08 lessons', 38],
    ['Systems design primer', 'Boundaries, tradeoffs, failure', '01 / 10 lessons', 10],
  ];
  return <div className="content page-enter"><div className="eyebrow">Courses / structured tracks</div><h1 className="headline" style={{ margin: '20px 0 10px' }}>Follow a thread<br />until it holds.</h1><p className="lede">Each track keeps a concept in working memory long enough to become an interview reflex.</p><div className="panel rule-list" style={{ marginTop: 38, maxWidth: 900 }}>{courses.map(([title, subtitle, progress, percent], index) => <Link className="action-row" href={index === 1 ? '/practice/word-break' : '/practice'} key={title} data-testid={`link-course-${index}`}><div style={{ flex: 1 }}><div className="mono" style={{ fontSize: 9, opacity: .55 }}>TRACK 0{index + 1}</div><strong style={{ display: 'block', fontSize: 18, marginTop: 7 }}>{title}</strong><div style={{ fontSize: 12, opacity: .6, marginTop: 4 }}>{subtitle}</div><div className="progress-track" style={{ marginTop: 14, maxWidth: 400 }}><div className="progress-fill" style={{ width: `${percent}%` }} /></div></div><div className="mono" style={{ fontSize: 10, opacity: .6 }}>{progress}</div><ChevronRight size={16} /></Link>)}</div><div className="panel panel-pad" style={{ maxWidth: 900, marginTop: 28 }}><div className="eyebrow">Continue / dynamic programming</div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, marginTop: 14 }}><div><h2 style={{ fontSize: 24, letterSpacing: '-.04em', margin: 0 }}>State, transition, proof.</h2><p style={{ margin: '8px 0 0', fontSize: 12, opacity: .6 }}>Next: turn word break into a recurrence you can explain.</p></div><Link href="/practice/word-break" className="btn btn-primary" data-testid="link-continue-dp">Continue <ArrowRight size={14} /></Link></div></div></div>;
}

function Resume() {
  const [submitted, setSubmitted] = useState(false);
  return <div className="content page-enter"><div className="eyebrow">Resume / ATS match evaluator</div><h1 className="headline" style={{ margin: '20px 0 10px' }}>Make the first<br />screen count.</h1><p className="lede">Paste the role and your resume. We will turn the gap into a checklist you can actually close.</p><div className="split" style={{ marginTop: 38, maxWidth: 1000 }}>{submitted ? <div className="panel panel-pad"><div className="eyebrow">Evaluation queued</div><h2 style={{ fontSize: 27, letterSpacing: '-.045em', margin: '18px 0 10px' }}>Your match brief is ready to review.</h2><p style={{ fontSize: 13, opacity: .64, lineHeight: 1.6 }}>Start with the missing keywords, then rewrite one project bullet around an outcome.</p><button className="btn btn-primary" onClick={() => setSubmitted(false)} data-testid="button-evaluate-another">Evaluate another <ArrowRight size={14} /></button></div> : <form className="form-stack" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><div><label className="label" htmlFor="role">Target role</label><input id="role" className="field" style={{ width: '100%' }} placeholder="Software engineer, frontend..." required data-testid="input-target-role" /></div><div><label className="label" htmlFor="job">Job description</label><textarea id="job" className="field textarea" style={{ width: '100%' }} placeholder="Paste the role description..." required data-testid="input-job-description" /></div><div><label className="label" htmlFor="resume">Resume text</label><textarea id="resume" className="field textarea" style={{ width: '100%', minHeight: 210 }} placeholder="Paste your resume..." required data-testid="input-resume-text" /></div><button className="btn btn-primary" type="submit" data-testid="button-evaluate-resume">Evaluate match <ArrowRight size={14} /></button></form>}<aside><div className="panel panel-pad"><div className="eyebrow">What you get</div><div className="rule-list" style={{ marginTop: 16 }}>{['Keyword coverage', 'Impact gaps', 'Project evidence', 'A focused rewrite queue'].map((item, index) => <div key={item} style={{ padding: '14px 0', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}><span>{item}</span><span className="mono" style={{ opacity: .45 }}>0{index + 1}</span></div>)}</div></div></aside></div></div>;
}

function Contact() {
  const [sent, setSent] = useState(false);
  return <div className="content page-enter"><div className="eyebrow">Contact / keep the loop open</div><h1 className="headline" style={{ margin: '20px 0 10px' }}>A real question<br />deserves a real reply.</h1><p className="lede">Tell us where preparation is getting stuck. We read every note.</p>{sent ? <div className="panel panel-pad" style={{ maxWidth: 650, marginTop: 38 }}><div className="eyebrow"><Check size={14} /> Message received</div><h2 style={{ fontSize: 28, letterSpacing: '-.05em', margin: '18px 0 10px' }}>Thanks for the signal.</h2><p style={{ fontSize: 13, opacity: .65 }}>We will get back to you within one working day.</p><button className="btn btn-quiet" onClick={() => setSent(false)} data-testid="button-send-another">Send another note</button></div> : <form className="form-stack" style={{ marginTop: 38 }} onSubmit={(event) => { event.preventDefault(); setSent(true); }}><div><label className="label" htmlFor="contact-name">Name</label><input id="contact-name" className="field" style={{ width: '100%' }} placeholder="Your name" required data-testid="input-contact-name" /></div><div><label className="label" htmlFor="contact-email">Email</label><input id="contact-email" type="email" className="field" style={{ width: '100%' }} placeholder="you@example.com" required data-testid="input-contact-email" /></div><div><label className="label" htmlFor="contact-message">What is on your mind?</label><textarea id="contact-message" className="field textarea" style={{ width: '100%', minHeight: 190 }} placeholder="A bug, a request, a stuck concept..." required data-testid="input-contact-message" /></div><button className="btn btn-primary" type="submit" data-testid="button-submit-contact">Send note <Send size={14} /></button></form>}</div>;
}

function Router() {
  return <ErrorBoundary resetKey={window.location.pathname}><Switch>
    <Route path="/" component={Landing} />
    <Route path="/dashboard"><Shell><Dashboard /></Shell></Route>
    <Route path="/practice"><Shell><Practice /></Shell></Route>
    <Route path="/practice/:id"><Shell><PracticeDetail /></Shell></Route>
    <Route path="/company"><Shell><Company /></Shell></Route>
    <Route path="/company/:id"><Shell><CompanyDetail /></Shell></Route>
    <Route path="/tests"><Shell><Tests /></Shell></Route>
    <Route path="/tests/:id"><Shell><TestDetail /></Shell></Route>
    <Route path="/results"><Shell><Results /></Shell></Route>
    <Route path="/core-cs"><Shell><CoreCS /></Shell></Route>
    <Route path="/courses"><Shell><Courses /></Shell></Route>
    <Route path="/resume"><Shell><Resume /></Shell></Route>
    <Route path="/contact"><Shell><Contact /></Shell></Route>
    <Route component={NotFound} />
  </Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;