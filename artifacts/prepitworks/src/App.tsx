import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
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
  setAuthTokenGetter,
  setBaseUrl,
} from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness, Check, ChevronRight, Clock3, Code2, FileText, Gauge, GraduationCap, LayoutDashboard, Moon, Play, Search, Send, Sun, Timer, Trophy } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001';
setBaseUrl(API_BASE_URL);
const STORAGE_KEY = 'prepitworks-user-name';
const EMAIL_KEY = 'prepitworks-user-email';
const AUTH_TOKEN_KEY = 'prepitworks-auth-token';
setAuthTokenGetter(() => window.localStorage.getItem(AUTH_TOKEN_KEY));

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
  { id: 'java', name: 'Java 21', code: 'public class Main {\n    static int[] solve(int[] values, int target) {\n        // write the invariant first\n        return new int[] {};\n    }\n\n    public static void main(String[] args) {\n        int[] answer = solve(new int[] {2, 7, 11, 15}, 9);\n        System.out.println(answer.length == 0 ? "No pair" : answer[0] + "," + answer[1]);\n    }\n}' },
  { id: 'cpp', name: 'C++ 20', code: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<int> solve(vector<int> values, int target) {\n    // write the invariant first\n    return {};\n}\n\nint main() {\n    const auto answer = solve({2, 7, 11, 15}, 9);\n    cout << (answer.empty() ? "No pair" : "0,1") << endl;\n}' },
  { id: 'javascript', name: 'JavaScript', code: 'function solve(values, target) {\n  // write the invariant first\n  return [];\n}\n\nconsole.log(solve([2, 7, 11, 15], 9));' },
  { id: 'go', name: 'Go 1.22', code: 'package main\n\nfunc solve(values []int, target int) []int {\n    // write the invariant first\n    return []int{}\n}' },
];

function useFallback<T>(data: T | undefined, fallback: T) {
  return data ?? fallback;
}

function useArrayFallback<T>(data: T[] | undefined | null, fallback: T[]) {
  return Array.isArray(data) ? data : fallback;
}

function getStoredUserName(): string {
  if (typeof window === 'undefined') return 'Ananya';
  return (window.localStorage.getItem(STORAGE_KEY) || 'Ananya').trim() || 'Ananya';
}

function getInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return 'AK';
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'AK';
}

type ProgressActivity = 'problem_solved' | 'course' | 'core_cs' | 'mock_test';

async function recordProgress(activity: ProgressActivity, options: { minutes?: number; practiceId?: string } = {}) {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return false;
  const response = await fetch(`${API_BASE_URL}/api/auth/progress`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ activity, ...options }),
  });
  if (!response.ok) return false;
  await queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  return true;
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (window.localStorage.getItem('prepitworks-theme') === 'dark' ? 'dark' : 'light'));
  const userName = getStoredUserName();
  const initials = getInitials(userName);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('prepitworks-theme', theme);
  }, [theme]);
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
          <div className="topbar-right"><span>Mon, 14 Oct</span><button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} data-testid="button-theme-toggle">{theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}</button><span className="avatar" aria-label="User profile" data-testid="avatar-user" title={userName}>{initials}</span></div>
        </header>
        {children}
      </main>
    </div>
  );
}

function LoginPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState(() => getStoredUserName());
  const [email, setEmail] = useState(() => window.localStorage.getItem(EMAIL_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = name.trim();
    const cleanedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!cleaned) {
      setError('Please enter your name to continue.');
      return;
    }

    if (!cleanedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!trimmedPassword) {
      setError('Please enter a password to continue.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: cleaned, email: cleanedEmail, password: trimmedPassword }),
      });
      const result = await response.json() as { token?: string; message?: string; user?: { name: string; email: string } };
      if (!response.ok || !result.token || !result.user) {
        setError(result.message ?? 'Unable to sign in right now.');
        return;
      }

      window.localStorage.setItem(STORAGE_KEY, result.user.name);
      window.localStorage.setItem(EMAIL_KEY, result.user.email);
      window.localStorage.setItem(AUTH_TOKEN_KEY, result.token);
      await queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      setLocation('/dashboard');
    } catch {
      setError('Unable to connect to the preparation server.');
    }
  };

  return (
    <div className="login-page noise">
      <header className="login-topbar"><Logo /><span className="topbar-kicker">Placement preparation / 2025</span></header>
      <main className="login-content">
        <div className="login-frame">
        <section className="login-intro">
          <Logo />
          <div className="login-intro-copy">
            <div className="eyebrow">Welcome back</div>
            <h1 className="login-title">Your prep starts with focus, structure, and momentum.</h1>
            <p className="lede">PrepitWorks helps students and early-career engineers turn interview prep into a daily system: solve the right problems, track readiness, compare company paths, and keep feedback visible at every step.</p>
          </div>

          <div className="login-highlights">
            {[
              ['Daily loop', 'One plan, one focus area, one meaningful session at a time.'],
              ['Interview signal', 'Measure readiness with practice, tests, and guided company prep.'],
              ['Career clarity', 'Move from vague effort to a real shortlist and next action.'],
            ].map(([title, copy]) => (
              <div key={title} className="login-highlight">
                <div className="eyebrow">{title}</div>
                <p>{copy}</p>
              </div>
            ))}
          </div>

          <div className="mark-grid login-mark-grid">
            {[
              ['01 / Focus', 'A clean priority queue keeps your best next move obvious.'],
              ['02 / Signal', 'Track readiness with heatmaps, progress, and recurring themes.'],
              ['03 / Momentum', 'Build momentum through practice, mock tests, and company strategy.'],
            ].map(([title, copy]) => <div className="mark-grid-row" key={title}><span>{title}</span><span>{copy}</span></div>)}
          </div>
        </section>

        <section className="login-form-panel">
          <form onSubmit={handleSubmit} className="login-form">
            <div className="eyebrow">Sign in</div>
            <h2 className="login-form-title">Continue to PrepitWorks</h2>
            <div className="login-fields">
              <div>
                <label className="label" htmlFor="login-name">Full name</label>
                <input id="login-name" className="field" value={name} onChange={(event) => { setName(event.target.value); if (error) setError(''); }} placeholder="Enter your full name" data-testid="input-login-name" />
              </div>
              <div>
                <label className="label" htmlFor="login-email">Email address</label>
                <input id="login-email" type="email" className="field" value={email} onChange={(event) => { setEmail(event.target.value); if (error) setError(''); }} placeholder="you@example.com" data-testid="input-login-email" />
              </div>
              <div>
                <label className="label" htmlFor="login-password">Password</label>
                <input id="login-password" type="password" className="field" value={password} onChange={(event) => { setPassword(event.target.value); if (error) setError(''); }} placeholder="Enter your password" data-testid="input-login-password" />
              </div>
            </div>
            {error && <div className="login-error">{error}</div>}
            <button className="btn btn-primary login-submit" type="submit" data-testid="button-login-submit">Enter dashboard <ArrowRight size={15} /></button>
            <div className="login-note">Your name, email, and progress are saved for your next session.</div>
          </form>
        </section>
        </div>
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
              <Link href="/login" className="btn btn-primary" data-testid="link-start-preparation">Start preparation <ArrowRight size={15} /></Link>
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
  const heat = Array.isArray(dashboard.heatmap) ? dashboard.heatmap : fallbackDashboard.heatmap;
  const userName = getStoredUserName();
  return <div className="content page-enter">
    <div className="eyebrow">Monday / command center</div>
    <h1 className="headline" style={{ margin: '20px 0 10px' }}>Good morning, {userName}.</h1>
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
          <div className="heatmap" data-testid="heatmap-readiness">{Array.from({ length: 35 }, (_, index) => { const item = heat.length ? heat[index % heat.length] : undefined; const score = item?.score ?? 0; const level = item ? (score > 75 ? 4 : score > 55 ? 3 : score > 35 ? 2 : 1) : 0; return <div className="heat-cell" data-level={level} key={index} title={item ? `${item.topic}: ${score}%` : 'No topic data'} data-testid={`heat-cell-${index}`} />; })}</div>
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
  const [category, setCategory] = useState(() => new URLSearchParams(window.location.search).get('category') ?? 'All topics');
  const [difficulty, setDifficulty] = useState('All levels');
  const params = useMemo(() => ({ search: search || undefined, category: category === 'All topics' ? undefined : category, difficulty: difficulty === 'All levels' ? undefined : difficulty }), [search, category, difficulty]);
  const query = useListPractice(params, { query: { queryKey: getListPracticeQueryKey(params), retry: false } });
  const remote = useArrayFallback(query.data, fallbackPractice);
  const normalizedSearch = search.trim().toLowerCase();
  const questions = remote.filter((item) => {
    const searchable = `${item.title} ${item.category} ${item.tags.join(' ')} ${item.prompt} ${item.explanation}`.toLowerCase();
    return (!normalizedSearch || searchable.includes(normalizedSearch))
      && (category === 'All topics' || item.category === category)
      && (difficulty === 'All levels' || item.difficulty === difficulty);
  });
  const categories = ['All topics', ...Array.from(new Set(remote.map((item) => item.category)))];
  return <div className="content page-enter">
    <div className="eyebrow">Practice bank / {remote.length.toString().padStart(3, '0')} questions</div>
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

  const runCode = async () => {
    setIsRunning(true);
    setOutput(`RUNNING / ${language.name}\ncompiling your code...`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/compile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ language: language.id, code }),
      });
      const result = await response.json() as { output?: string; error?: string };
      if (!response.ok) {
        setOutput(`ERROR / compiler unavailable\n\n${result.error ?? 'The compiler service returned an error.'}`);
      } else if (result.error) {
        setOutput(`ERROR / ${language.name}\n\n${result.error}`);
      } else {
        setOutput(`OUTPUT / ${language.name}\n\n${result.output || '(no output)'}`);
      }
    } catch {
      setOutput('ERROR / unable to reach the compiler service');
    } finally {
      setIsRunning(false);
    }
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
  const practiceItems = useArrayFallback(query.data, fallbackPractice);
  const question = practiceItems.find((item) => item.id === id) ?? fallbackPractice[0];
  const [labOpen, setLabOpen] = useState(false);
  const [solved, setSolved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const markSolved = async () => {
    setIsSaving(true);
    const saved = await recordProgress('problem_solved', { practiceId: question.id });
    setIsSaving(false);
    if (saved) setSolved(true);
  };
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
        <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={markSolved} disabled={solved || isSaving} data-testid="button-mark-problem-solved">{solved ? 'Problem solved' : isSaving ? 'Saving progress' : 'Mark problem solved'} <Check size={14} /></button>
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
  const companies = useArrayFallback(query.data, fallbackCompanies);
  return <div className="content page-enter"><div className="eyebrow">Company preparation / choose a lane</div><h1 className="headline" style={{ margin: '20px 0 10px' }}>Prepare for the<br />conversation behind the code.</h1><p className="lede">Each company plan is a short, opinionated route through its loop. No sprawling syllabus.</p>{query.isError && <div style={{ marginTop: 18 }}><ErrorBlock retry={() => query.refetch()} /></div>}<div className="company-grid" style={{ marginTop: 36 }}>{companies.map((company, index) => <Link href={`/company/${company.id}`} className="company-card page-enter" style={{ animationDelay: `${index * .07}s` }} key={company.id} data-testid={`card-company-${company.id}`}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div className="logo-box">{company.logo}</div><span className="mono" style={{ fontSize: 9, opacity: .6 }}>{company.rounds} ROUNDS</span></div><h2 style={{ fontSize: 25, letterSpacing: '-.045em', margin: '24px 0 8px' }}>{company.name}</h2><p style={{ fontSize: 12, opacity: .64, lineHeight: 1.5, margin: 0 }}>{company.focus}</p><div className="card-foot"><span>{company.applicants} pass rate</span><ArrowRight size={14} /></div></Link>)}</div></div>;
}

function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const query = useListCompanies({ query: { queryKey: getListCompaniesQueryKey(), retry: false } });
  const companies = useArrayFallback(query.data, fallbackCompanies);
  const company = companies.find((item) => item.id === id) ?? fallbackCompanies[0];
  return <div className="content page-enter"><Link href="/company" className="eyebrow" data-testid="link-back-company"><ArrowLeft size={14} /> Company plans</Link><div className="split-wide" style={{ marginTop: 34 }}><section><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><div className="logo-box">{company.logo}</div><div><div className="mono" style={{ fontSize: 9, opacity: .55 }}>{company.rounds} ROUNDS / {company.applicants}</div><h1 className="headline" style={{ margin: '8px 0 0' }}>{company.name}</h1></div></div><p className="lede" style={{ marginTop: 24 }}>{company.overview}</p><div className="section-line" style={{ marginTop: 44 }}><div><div className="eyebrow">The route</div><div className="section-title" style={{ marginTop: 10 }}>Four focused sessions</div></div></div><div className="panel rule-list">{company.plan.map((item, index) => <div className="action-row" key={item}><div style={{ display: 'flex', gap: 16, alignItems: 'center' }}><span className="mono" style={{ fontSize: 10, opacity: .5 }}>0{index + 1}</span><span style={{ fontSize: 13 }}>{item}</span></div><Check size={15} /></div>)}</div></section><aside><div className="panel panel-pad"><div className="eyebrow">Loop profile</div><div style={{ marginTop: 22 }}><div className="mono" style={{ fontSize: 9, opacity: .55 }}>PRIMARY FOCUS</div><strong style={{ display: 'block', fontSize: 18, marginTop: 7 }}>{company.focus}</strong></div><div style={{ marginTop: 24 }}><div className="mono" style={{ fontSize: 9, opacity: .55 }}>WHAT TO PRACTICE</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}><span className="tag">Problem framing</span><span className="tag">Tradeoffs</span><span className="tag">Clarity</span></div></div><Link href="/tests/google-screen" className="btn btn-primary" style={{ marginTop: 30, width: '100%' }} data-testid="link-company-test">Take a matching mock <ArrowRight size={14} /></Link></div><div className="panel panel-pad" style={{ marginTop: 14 }}><div className="eyebrow">Practice prompt</div><p style={{ fontSize: 14, lineHeight: 1.6, margin: '18px 0 0' }}>“Tell me about a time you changed your approach after learning something new.”</p></div></aside></div></div>;
}

function Tests() {
  const query = useListTests({ query: { queryKey: getListTestsQueryKey(), retry: false } });
  const tests = useArrayFallback(query.data, fallbackTests);
  return <div className="content page-enter"><div className="eyebrow">Mock assessments / pressure, measured</div><h1 className="headline" style={{ margin: '20px 0 10px' }}>A test is useful<br />when it tells you what next.</h1><p className="lede">Timed, short, and followed by a recommendation you can act on immediately.</p>{query.isError && <div style={{ marginTop: 18 }}><ErrorBlock retry={() => query.refetch()} /></div>}<div className="test-grid" style={{ marginTop: 38 }}>{tests.map((test, index) => <Link href={`/tests/${test.id}`} className="test-card page-enter" style={{ animationDelay: `${index * .08}s` }} key={test.id} data-testid={`card-test-${test.id}`}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="tag">{test.type}</span><span className="mono" style={{ fontSize: 9, opacity: .55 }}>{test.difficulty}</span></div><h3>{test.title}</h3><p style={{ fontSize: 12, lineHeight: 1.5, opacity: .64, margin: 0 }}>{test.description}</p><div className="test-meta" style={{ marginTop: 'auto', paddingTop: 24 }}><span><Clock3 size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />{test.duration} min</span><span>{test.questions} questions</span></div></Link>)}</div></div>;
}

function TestDetail() {
  const { id } = useParams<{ id: string }>();
  const testsQuery = useListTests({ query: { queryKey: getListTestsQueryKey(), retry: false } });
  const tests = useArrayFallback(testsQuery.data, fallbackTests);
  const test = tests.find((item) => item.id === id) ?? fallbackTests[0];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const submit = useSubmitTest();
  const questions = Array.from({ length: test.questions }, (_, questionIndex) => testPrompts[questionIndex % testPrompts.length]);
  const handleSubmit = () => {
    submit.mutate({ testId: test.id, data: { answers } }, {
      onSuccess: (result) => { void recordProgress('mock_test', { minutes: test.duration }); localStorage.setItem('prepitworks-result', JSON.stringify(result)); setSubmitted(true); },
      onError: () => { void recordProgress('mock_test', { minutes: test.duration }); const result: TestResult = { score: Object.keys(answers).length, total: test.questions, percentage: Math.round((Object.keys(answers).length / test.questions) * 100), recommendation: 'Review the unanswered prompts, then retake this in three days.' }; localStorage.setItem('prepitworks-result', JSON.stringify(result)); setSubmitted(true); },
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
  useEffect(() => { void recordProgress('core_cs', { minutes: 5 }); }, []);
  const subjects = [
    ['Operating systems', 'Processes, threads, scheduling, and the memory model.', '06 guides'],
    ['Databases', 'Indexes, transactions, normalization, and query planning.', '08 guides'],
    ['Computer networks', 'HTTP, TCP, DNS, and the path a request takes.', '05 guides'],
    ['Object-oriented design', 'Modeling behavior, boundaries, and change.', '07 guides'],
    ['Distributed systems', 'Consistency, queues, failure, and graceful scale.', '04 guides'],
    ['Low-level foundations', 'Concurrency, storage, and the cost of abstraction.', '03 guides'],
  ];
  return <div className="content page-enter"><div className="eyebrow">Core CS / interview guides</div><h1 className="headline" style={{ margin: '20px 0 10px' }}>The concepts<br />under the answers.</h1><p className="lede">Original, structured study notes for GATE CSE fundamentals and placement interviews.</p><div className="card-grid" style={{ marginTop: 38 }}>{subjects.map(([title, copy, count], index) => <Link href={`/core-cs/${title.toLowerCase().replaceAll(' ', '-')}`} className="question-card" style={{ minHeight: 205 }} key={title} data-testid={`card-subject-${index}`}><span className="mono" style={{ fontSize: 9, opacity: .55 }}>0{index + 1} / {count}</span><h3>{title}</h3><p>{copy}</p><div className="card-foot"><span>Read guide</span><ArrowRight size={14} /></div></Link>)}</div></div>;
}

function CoreCSDetail() {
  const { id } = useParams<{ id: string }>();
  const guides: Record<string, { title: string; summary: string; sections: [string, string][] }> = {
    'operating-systems': { title: 'Operating systems', summary: 'Build a mental model from processes and threads to scheduling, memory, files, and deadlocks.', sections: [['Processes and threads', 'A process owns an address space and operating-system resources. A thread is an execution path inside that process. Explain context switching by naming the saved registers, stack pointer, program counter, and scheduler decision.'], ['Scheduling', 'Compare turnaround, waiting, response, and throughput. First-come-first-served is easy to reason about but can create convoy effects. Round robin improves response with a time quantum, while priority scheduling needs an answer for starvation.'], ['Memory', 'Virtual memory maps process addresses to physical frames through page tables and translation caches. Page faults are expensive because the operating system must locate a page, evict or write a frame when needed, update metadata, and resume the instruction.'], ['Concurrency and deadlock', 'A race occurs when correctness depends on an uncontrolled interleaving. Locks, atomic operations, semaphores, and condition variables solve different coordination problems. Deadlock needs mutual exclusion, hold-and-wait, no preemption, and circular wait.']] },
    'databases': { title: 'Databases', summary: 'Prepare for data modeling, indexing, transactions, recovery, and query planning questions.', sections: [['Relational modeling', 'Choose keys that identify facts, separate repeating attributes, and make relationship cardinality explicit. Normalization reduces update anomalies, while deliberate denormalization can trade write simplicity for read speed.'], ['Indexes', 'An index is an access path, not a guarantee of speed. Discuss selectivity, ordering, covering columns, write amplification, and the difference between an index scan and a full table scan.'], ['Transactions', 'Atomicity, consistency, isolation, and durability describe guarantees, not implementation details. Isolation levels trade concurrency against anomalies such as dirty reads, non-repeatable reads, and phantoms.'], ['Recovery', 'A write-ahead log records durable intent before data pages are flushed. Checkpoints shorten recovery, while redo and undo make committed and incomplete transactions converge to a valid state.']] },
    'computer-networks': { title: 'Computer networks', summary: 'Trace a request from DNS through transport, HTTP, caching, and failure recovery.', sections: [['Naming and routing', 'DNS maps names to records through recursive and authoritative servers. Routing forwards packets across networks using prefixes, while the application should still expect delay, loss, reordering, and unreachable peers.'], ['Transport', 'TCP gives an ordered byte stream with connection setup, acknowledgements, retransmission, flow control, and congestion control. UDP gives a datagram boundary with fewer guarantees and lower protocol overhead.'], ['HTTP', 'HTTP methods communicate intent and status codes communicate outcome. Idempotency matters when a client retries a request, and cache headers must distinguish public immutable assets from private user data.'], ['Reliability', 'Timeouts, bounded retries, exponential backoff, circuit breakers, and request IDs make failures diagnosable. Retrying every failure blindly can multiply load during an outage.']] },
    'object-oriented-design': { title: 'Object-oriented design', summary: 'Use responsibilities, contracts, composition, and interfaces to explain maintainable software design.', sections: [['Responsibilities', 'A class should own a coherent reason to change. Start with behavior and collaborators rather than jumping to inheritance. A small interface is easier to test and replace than a broad object with hidden side effects.'], ['Composition', 'Composition wires objects together without forcing a rigid taxonomy. Prefer delegation when behavior can vary independently, and use dependency inversion when high-level policy should not depend on infrastructure details.'], ['Contracts', 'State preconditions, postconditions, invariants, and failure behavior. A method that returns a partial result or mutates input should make that contract visible to callers and tests.'], ['Patterns', 'Patterns are vocabulary for recurring trade-offs. Factory methods control construction, adapters isolate incompatible interfaces, and observers broadcast events, but each adds indirection that should earn its complexity.']] },
    'distributed-systems': { title: 'Distributed systems', summary: 'Study consistency, partition tolerance, queues, replication, and operational failure modes.', sections: [['Failure model', 'A remote call can be slow, duplicated, reordered, or permanently unavailable. Design with deadlines, idempotency keys, health signals, and a clear owner for retries.'], ['Consistency', 'Strong consistency simplifies reads but can increase coordination cost. Eventual consistency improves availability and latency when the product can tolerate convergence, but users need explicit conflict and freshness behavior.'], ['Queues', 'A queue separates producers from consumers and absorbs bursts. Discuss delivery semantics, visibility timeouts, dead-letter handling, ordering scope, and what happens when a consumer crashes after side effects.'], ['Replication and observability', 'Replication improves availability and read scale but introduces lag and failover decisions. Logs explain events, metrics show trends, and traces connect one request across services.']] },
    'low-level-foundations': { title: 'Low-level foundations', summary: 'Connect memory, storage, concurrency, and runtime cost to practical engineering decisions.', sections: [['Memory and locality', 'Caches exploit spatial and temporal locality. Data layout changes cache misses, branch behavior, and allocation pressure, which is why an algorithm with the same Big-O cost can perform very differently.'], ['Storage', 'Sequential access, random access, buffering, and durability shape storage performance. Explain why batching writes helps and why a durable acknowledgement must mean more than a value existing in process memory.'], ['Concurrency', 'Parallel work needs a shared-state strategy. Immutability reduces coordination, message passing moves ownership, and locks require a defined order to avoid cycles and contention.'], ['Cost reasoning', 'Name the dominant resource: CPU, memory, network, storage, or coordination. Then state the measurement that would confirm the hypothesis before optimizing.']] },
  };
  const guide = guides[id ?? ''] ?? guides['operating-systems'];
  const extraChapters: Record<string, [string, string][]> = {
    'operating-systems': [['Files and storage', 'A file system maps names to metadata and blocks. Follow an open, read, write, sync, and close sequence, then compare contiguous allocation, linked allocation, and indexed allocation. Diagram: process -> system call -> virtual file system -> file system driver -> storage device.'], ['Exam drills', 'Practise page-replacement tables, CPU scheduling timelines, semaphore traces, and deadlock detection graphs. For every answer, state the invariant, show the state transition, and identify the cost of the operation.'], ['Revision checklist', 'Before an exam, revise process states, context switching, scheduling metrics, page tables, TLBs, faults, inode-style metadata, protection, and deadlock recovery. Explain each topic once without using memorised sentences.']],
    'databases': [['SQL and query execution', 'Read a query from the access path backward: filters, joins, grouping, sorting, and projection. Diagram: SQL -> parser -> logical plan -> optimizer -> physical operators -> buffer manager -> pages. Compare nested-loop, hash, and merge joins using cardinality and available indexes.'], ['Exam drills', 'Practise functional dependencies, candidate keys, decomposition, serializability schedules, B+ tree height, recovery logs, and relational algebra translations. Show intermediate relations rather than jumping to the final answer.'], ['Revision checklist', 'Revise normalization, indexes, joins, transactions, locks, isolation anomalies, logging, checkpoints, views, constraints, and distributed data trade-offs. For each, write one case where the simpler design is preferable.']],
    'computer-networks': [['Application and transport design', 'Trace a browser request from cache lookup through DNS, connection setup, TLS, HTTP, server work, and response rendering. Diagram: client -> resolver -> load balancer -> service -> database. Mark where latency, retries, and authentication belong.'], ['Exam drills', 'Practise subnetting, sliding-window calculations, TCP sequence numbers, DNS records, HTTP caching, routing tables, and congestion scenarios. Draw packets and state changes instead of relying on a formula alone.'], ['Revision checklist', 'Revise layering, addressing, ARP, routing, TCP, UDP, DNS, HTTP, TLS, proxies, caching, and failure recovery. Explain which layer owns each responsibility and what evidence you would collect during debugging.']],
    'object-oriented-design': [['Design exercises', 'Turn a vague requirement into actors, responsibilities, interfaces, state transitions, and tests. Diagram: policy -> interface <- adapter -> infrastructure. Keep the policy independent from file systems, networks, and frameworks.'], ['Exam drills', 'Practise choosing composition versus inheritance, spotting leaky abstractions, designing immutable value objects, and explaining dependency inversion. Include one extension request and show which module changes.'], ['Revision checklist', 'Revise cohesion, coupling, SOLID trade-offs, contracts, exceptions, object lifecycles, composition, interfaces, common patterns, and test seams. A good answer explains why a pattern is needed and what complexity it adds.']],
    'distributed-systems': [['Coordination and data flow', 'A distributed request crosses failure boundaries. Diagram: client -> gateway -> queue -> worker -> store, with timeout and retry edges at every remote call. Define idempotency before adding retries, and define ownership before adding replication.'], ['Exam drills', 'Practise consistency choices, leader failure, duplicate delivery, queue backpressure, cache invalidation, rate limits, and partition recovery. State the user-visible guarantee rather than claiming every system is strongly consistent.'], ['Revision checklist', 'Revise clocks, ordering, consensus intuition, replication lag, quorum reads, queues, retries, circuit breakers, observability, and disaster recovery. For each topic, state the failure it handles and the failure it cannot handle.']],
    'low-level-foundations': [['Runtime and performance', 'Connect source code to memory, calls, allocation, I/O, and cache behavior. Diagram: source -> compiler -> object code -> loader -> process address space -> CPU and memory hierarchy. Measure before changing the implementation.'], ['Exam drills', 'Practise pointer ownership, stack and heap lifetime, cache locality, lock contention, system-call cost, buffering, and binary representation. Use a small trace to show where bytes and ownership move.'], ['Revision checklist', 'Revise representation, alignment, virtual memory, caches, storage, processes, threads, atomics, synchronization, compilation, linking, and profiling. Always name the resource that limits the design.']],
  };
  const chapters: [string, string][] = [...guide.sections, ...(extraChapters[id ?? ''] ?? extraChapters['operating-systems'])];
  useEffect(() => { void recordProgress('core_cs', { minutes: 5 }); }, [id]);
  return <div className="content page-enter"><Link href="/core-cs" className="eyebrow"><ArrowLeft size={14} /> Core CS</Link><h1 className="headline" style={{ margin: '20px 0 12px' }}>{guide.title}</h1><p className="lede">{guide.summary}</p><div className="panel rule-list" style={{ maxWidth: 900, marginTop: 36 }}>{chapters.map(([title, copy], index) => <article className="panel-pad" key={title}><div className="eyebrow">0{index + 1} / {title}</div><p style={{ fontSize: 14, lineHeight: 1.75, opacity: .72, margin: '18px 0 0' }}>{copy}</p></article>)}</div></div>;
}

function Courses() {
  useEffect(() => { void recordProgress('course', { minutes: 5 }); }, []);
  const courses = [
    { title: 'DSA foundations', subtitle: 'Arrays → trees → graphs', progress: '00 / 12 lessons', percent: 0, href: '/practice?category=DSA', lessons: [['01', 'Complexity and invariants', 'Learn to state constraints, choose a baseline, prove the invariant, and report time and space cost before coding.'], ['02', 'Arrays and prefix reasoning', 'Build range queries, two-pointer scans, sliding windows, and prefix structures from small worked examples.'], ['03', 'Linked lists and pointer ownership', 'Trace reversal, merging, cycle detection, and fast-slow pointers while keeping every pointer transition explicit.'], ['04', 'Stacks, queues, and monotonic state', 'Use the right frontier for next-greater, breadth-first, parsing, and scheduling problems.'], ['05', 'Trees and recursive state', 'Turn preorder, inorder, postorder, height, diameter, and lowest-common-ancestor problems into reusable recursion contracts.'], ['06', 'Graphs and traversal choices', 'Choose BFS, DFS, topological order, or union-find based on reachability, dependencies, and connectivity.']] },
    { title: 'Dynamic programming', subtitle: 'State → transition → proof', progress: '00 / 10 lessons', percent: 0, href: '/practice?search=dynamic%20programming', lessons: [['01', 'Recognising overlapping subproblems', 'Separate a brute-force recursion into state, choices, repeated work, and a memo table.'], ['02', 'One-dimensional state', 'Solve climbing, house robber, stock, and prefix decisions by defining exactly what dp[i] means.'], ['03', 'Grid and two-dimensional state', 'Model paths, obstacles, edit operations, and resource limits as a table with valid base cases.'], ['04', 'Knapsack and choice transitions', 'Compare 0/1, unbounded, and bounded choices while explaining loop direction and duplicate use.'], ['05', 'Subsequences and intervals', 'Build LIS, LCS, partition, and interval transitions from the smaller answer they depend on.'], ['06', 'Optimisation and proof', 'Compress dimensions only after proving which previous states remain necessary and test boundary cases.']] },
    { title: 'Aptitude sprint', subtitle: 'Quantitative ability → reasoning → data interpretation', progress: '00 / 12 lessons', percent: 0, href: '/practice?category=Aptitude', lessons: [['01', 'Percentages and ratios', 'Translate percentage change into a base value, compare ratios without false cancellation, and check units.'], ['02', 'Profit, loss, and averages', 'Build equations from cost price, selling price, weighted average, and successive change scenarios.'], ['03', 'Time, work, and pipes', 'Convert work into rates, combine independent rates, and handle leaks or changing efficiency.'], ['04', 'Speed, distance, and trains', 'Choose a reference frame, convert units, and draw relative-motion timelines before calculating.'], ['05', 'Probability and counting', 'Define the sample space, distinguish independent from conditional events, and avoid double counting.'], ['06', 'Logical reasoning patterns', 'Use tables, constraints, syllogisms, arrangements, and elimination instead of guessing from visual patterns.'], ['07', 'Data interpretation', 'Read tables and charts, estimate safely, compare growth, and identify the smallest calculation that answers the question.']] },
    { title: 'Systems design primer', subtitle: 'Boundaries → trade-offs → failure', progress: '00 / 10 lessons', percent: 0, href: '/practice?category=System%20Design', lessons: [['01', 'Clarify requirements', 'Separate functional requirements, scale assumptions, latency targets, consistency needs, and explicit exclusions.'], ['02', 'API and data modelling', 'Define resources, idempotency, pagination, keys, ownership, and the read/write paths before drawing infrastructure.'], ['03', 'Storage and indexing', 'Choose relational, document, key-value, or search storage by access pattern, correctness, and operational cost.'], ['04', 'Caching and delivery', 'Place caches deliberately, define invalidation and freshness, and reason about cache stampedes and hot keys.'], ['05', 'Queues and asynchronous work', 'Use queues for burst absorption and isolation, then specify ordering, retries, dead letters, and duplicate delivery.'], ['06', 'Scaling and reliability', 'Add partitioning, replication, rate limiting, timeouts, observability, and graceful degradation as measured needs appear.']] },
    { title: 'Interview communication', subtitle: 'Make technical reasoning visible', progress: '00 / 08 lessons', percent: 0, href: '/practice', lessons: [['01', 'Frame the problem', 'Restate the task, ask targeted questions, name assumptions, and confirm the expected output before solving.'], ['02', 'Explain the baseline', 'Give a simple correct approach first, then identify the exact bottleneck that justifies an improvement.'], ['03', 'Narrate the invariant', 'Keep the listener oriented with a sentence describing what remains true after each loop or state transition.'], ['04', 'Handle edge cases', 'Use empty input, duplicates, limits, invalid data, and overflow to demonstrate deliberate testing.'], ['05', 'Discuss trade-offs', 'Compare time, memory, implementation complexity, maintainability, and production constraints without hand-waving.'], ['06', 'Close with confidence', 'Summarise correctness, complexity, tests, and the next improvement in a concise final explanation.']] },
    { title: 'Core CS interview track', subtitle: 'OS → DBMS → networks → design', progress: '00 / 14 lessons', percent: 0, href: '/core-cs', lessons: [['01', 'Operating systems', 'Processes, threads, scheduling, virtual memory, files, synchronisation, and deadlock through traceable examples.'], ['02', 'DBMS foundations', 'Keys, normalization, SQL execution, indexes, transactions, isolation, recovery, and query plans.'], ['03', 'Computer networks', 'Layering, addressing, DNS, TCP, HTTP, TLS, caching, and failure recovery from packet to request.'], ['04', 'Object-oriented design', 'Responsibilities, interfaces, composition, contracts, patterns, and testable boundaries.'], ['05', 'Distributed systems', 'Consistency, replication, queues, retries, idempotency, observability, and partition-aware design.'], ['06', 'Low-level foundations', 'Memory, storage, compilation, linking, concurrency, locality, and performance measurement.']] },
  ];
  return <div className="content page-enter"><div className="eyebrow">Courses / lesson tracks</div><h1 className="headline" style={{ margin: '20px 0 10px' }}>Study by module<br />until it holds.</h1><p className="lede">Each course now follows the subject: concepts first, worked reasoning next, then targeted questions and revision.</p><div style={{ display: 'grid', gap: 12, marginTop: 38, maxWidth: 980 }}>{courses.map((course, index) => <details className="panel" key={course.title} open={index === 0}><summary className="action-row" style={{ cursor: 'pointer', listStyle: 'none' }} data-testid={`course-module-${index}`}><div style={{ flex: 1 }}><div className="mono" style={{ fontSize: 9, opacity: .55 }}>TRACK 0{index + 1} / {course.lessons.length} LESSONS</div><strong style={{ display: 'block', fontSize: 18, marginTop: 7 }}>{course.title}</strong><div style={{ fontSize: 12, opacity: .6, marginTop: 4 }}>{course.subtitle}</div><div className="progress-track" style={{ marginTop: 14, maxWidth: 420 }}><div className="progress-fill" style={{ width: `${course.percent}%` }} /></div></div><div className="mono" style={{ fontSize: 10, opacity: .6 }}>{course.progress}</div><ChevronRight size={16} /></summary><div className="rule-list">{course.lessons.map(([number, title, copy]) => <div className="action-row" key={number}><div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1 }}><span className="mono" style={{ fontSize: 10, opacity: .5 }}>{number}</span><div><strong style={{ display: 'block', fontSize: 14 }}>{title}</strong><p style={{ margin: '7px 0 0', fontSize: 12, lineHeight: 1.6, opacity: .68 }}>{copy}</p><p style={{ margin: '8px 0 0', fontSize: 11, lineHeight: 1.5, opacity: .5 }}>Open the detailed note for concepts, diagrams, worked reasoning, and a practice checkpoint.</p></div></div><Link href={`/courses/${course.title.toLowerCase().replaceAll(' ', '-')}/${number}`} className="btn btn-quiet" data-testid={`link-course-lesson-${index}-${number}`}>Open lesson <ArrowRight size={13} /></Link></div>)}</div></details>)}</div><div className="panel panel-pad" style={{ maxWidth: 980, marginTop: 28 }}><div className="eyebrow">Continue / dynamic programming</div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, marginTop: 14 }}><div><h2 style={{ fontSize: 24, letterSpacing: '-.04em', margin: 0 }}>State, transition, proof.</h2><p style={{ margin: '8px 0 0', fontSize: 12, opacity: .6 }}>Next: turn word break into a recurrence you can explain.</p></div><Link href="/courses/dynamic-programming/02" className="btn btn-primary" data-testid="link-continue-dp">Continue <ArrowRight size={14} /></Link></div></div></div>;
}

const courseLessonData: Record<string, Array<{ title: string; overview: string; diagram: string; example: string; mistakes: string }>> = {
  'dsa-foundations': [
    { title: 'Complexity and invariants', overview: 'Start every algorithm with the constraint, the operation that repeats, and the statement that must remain true after each step.', diagram: 'input -> invariant -> repeated operation -> answer', example: 'For a one-pass scan, keep the best answer for the prefix already visited. At the next value, update the state, then prove that the state still represents the prefix.', mistakes: 'Do not quote Big-O without naming the input size. Do not optimise before establishing a correct baseline.' },
    { title: 'Arrays and prefix reasoning', overview: 'Arrays reward a precise view of ranges, boundaries, frequency, and the direction in which information becomes available.', diagram: 'values:  [ a ][ b ][ c ][ d ]\nprefix:  [a][a+b][a+b+c][a+b+c+d]', example: 'A range sum from left to right can be answered as prefix[right] - prefix[left - 1]. The same pattern extends to difference arrays and sliding windows.', mistakes: 'Check empty ranges, off-by-one endpoints, integer overflow, and whether a window is fixed-size or condition-driven.' },
    { title: 'Linked lists and pointer ownership', overview: 'Linked-list problems become manageable when every pointer has one job and the next node is saved before links change.', diagram: 'previous <- current -> next\n          reverse current.next', example: 'To reverse a list, save next, point current to previous, advance previous, and advance current. The invariant is that previous is already reversed.', mistakes: 'Never overwrite the only path to the remaining list. Test zero nodes, one node, and a cycle.' },
    { title: 'Stacks, queues, and monotonic state', overview: 'Choose a stack when the newest unresolved item matters, a queue when arrival order matters, and a monotonic structure when dominated candidates can be removed.', diagram: 'queue: first -> ... -> last\nstack: bottom -> ... -> top', example: 'For next greater element, keep unresolved indices in decreasing value order. A new larger value resolves smaller entries once, so each index is pushed and popped at most once.', mistakes: 'Define whether the structure stores values or indices. Empty the structure explicitly after the main scan.' },
    { title: 'Trees and recursive state', overview: 'A tree recursion needs a contract: what the call returns, what the parent contributes, and which base case ends the branch.', diagram: '          node\n       /        \\\n   left result  right result\n          \\    /\n          combine', example: 'For height, a node returns one plus the larger child height. For diameter, return height upward but update a separate best answer using both child heights.', mistakes: 'Do not mix a value returned to the parent with a global answer. State the null-node result first.' },
    { title: 'Graphs and traversal choices', overview: 'Graph algorithms depend on the relationship being asked: reachability, shortest unweighted distance, ordering, connectivity, or weighted cost.', diagram: 'vertices + edges -> representation -> traversal -> visited state', example: 'Use BFS for minimum edge count in an unweighted graph, DFS for exhaustive exploration, topological order for dependencies, and union-find for incremental connectivity.', mistakes: 'Mark visited at the correct time, handle disconnected components, and distinguish directed from undirected edges.' },
  ],
  'dynamic-programming': [
    { title: 'Recognising overlapping subproblems', overview: 'Dynamic programming is not a memorised list of problems. It is a way to store answers to states that a recursion would recompute.', diagram: 'brute recursion -> repeated states -> memo table -> linearised computation', example: 'Write the recursive choices first. Name the smallest parameters that determine the future, then cache exactly those parameters.', mistakes: 'A memo key missing one decision variable produces plausible but wrong answers. Verify the state with two different paths.' },
    { title: 'One-dimensional state', overview: 'A one-dimensional state often describes the best answer ending at, starting before, or using the first i items.', diagram: 'dp[0] -> dp[1] -> dp[2] -> ... -> dp[n]', example: 'For a no-adjacent selection problem, dp[i] is the best answer using the first i values. The transition chooses between skipping i and taking i plus the answer before its neighbour.', mistakes: 'Define whether i is an index or a count. Base cases should match that definition, not the code you hope to write.' },
    { title: 'Grid and two-dimensional state', overview: 'Grid DP works when the answer at a cell depends on a small set of already-solved directions or resource dimensions.', diagram: 'top -> cell <- left\ncell state = local cost + best predecessor', example: 'For path cost, choose the cheaper predecessor and add the current cell. For edit distance, compare insert, delete, and replace transitions.', mistakes: 'Handle the first row and column separately. Check whether diagonal movement or blocked cells change the predecessor set.' },
    { title: 'Knapsack and choice transitions', overview: 'Choice DP asks whether each item may be used once, many times, or a bounded number of times; loop direction encodes that rule.', diagram: 'capacity c -> choose item -> remaining capacity c - weight', example: 'For 0/1 knapsack, iterate capacity downward so an item cannot be reused in the same pass. For unbounded knapsack, upward iteration permits reuse.', mistakes: 'Mixing loop directions silently changes the problem. Test one item, capacity zero, and an item heavier than capacity.' },
    { title: 'Subsequences and intervals', overview: 'Subsequence DP compares positions while interval DP expands a range from shorter solved ranges to longer ranges.', diagram: 'short range -> longer range -> full interval\nleft cut + right cut + combine', example: 'For LCS, matching characters extend a diagonal state; otherwise keep the better result from dropping one side. For intervals, enumerate the split point only after shorter intervals exist.', mistakes: 'Keep ordering constraints visible. Do not sort a problem that depends on original sequence order.' },
    { title: 'Optimisation and proof', overview: 'Space compression is safe only when you can prove which previous states the transition reads and when updates preserve their old values.', diagram: 'full table -> dependency analysis -> rolling row -> scalar state', example: 'Draw arrows from every transition to its dependencies. The compressed loop must visit cells in an order that has not overwritten a needed predecessor.', mistakes: 'Optimise memory after correctness. Keep a table version for debugging and compare both implementations on random small cases.' },
  ],
  'aptitude-sprint': [
    { title: 'Percentages and ratios', overview: 'Treat a percentage as a multiplier on a clearly named base. Ratios compare quantities but do not automatically preserve units.', diagram: 'base value -> percentage multiplier -> changed value -> comparison', example: 'A 20% increase followed by a 20% decrease is 1.2 x 0.8 = 0.96, not the original value. Write the multipliers before calculating.', mistakes: 'Do not add percentages across different bases. Label the base quantity and reduce ratios only when units match.' },
    { title: 'Profit, loss, and averages', overview: 'Translate each statement into cost, selling, marked, discount, and quantity variables before choosing an equation.', diagram: 'cost price -> markup -> discount -> selling price', example: 'Weighted average uses total quantity and total value, not the average of averages unless group sizes are equal.', mistakes: 'Separate percentage profit on cost from margin on selling price. Check whether the question asks per item or for the complete batch.' },
    { title: 'Time, work, and pipes', overview: 'Convert each worker or pipe into a rate per unit time, combine rates, then invert the result only at the end.', diagram: 'individual rates -> combined rate -> total work -> time', example: 'If A completes work in x days and B in y, their combined rate is 1/x + 1/y. A leak contributes a negative rate.', mistakes: 'Do not add completion times. Keep rate signs and work units consistent.' },
    { title: 'Speed, distance, and trains', overview: 'Relative motion becomes simple when both objects are placed on one number line and all units are converted before equations are formed.', diagram: 'A ----->        <----- B\n       relative distance', example: 'For a train crossing a pole, use train length. For crossing a platform, use train length plus platform length. For opposite motion, add speeds.', mistakes: 'Convert km/h to m/s before using metres and seconds. Check whether motion is same-direction or opposite-direction.' },
    { title: 'Probability and counting', overview: 'Build the sample space before calculating probability, then decide whether events are independent, conditional, mutually exclusive, or overlapping.', diagram: 'sample space -> event filter -> favourable outcomes / total outcomes', example: 'For sequential draws without replacement, the denominator changes after the first draw. For arrangements, decide whether order matters before choosing a formula.', mistakes: 'Do not multiply dependent probabilities as if they were independent. Avoid counting the same arrangement under different labels.' },
    { title: 'Logical reasoning patterns', overview: 'Reasoning questions are constraint systems. Convert language into a table, graph, ordering, or set relationship before eliminating options.', diagram: 'clues -> constraints -> candidate table -> contradiction or solution', example: 'For arrangement problems, place the most restrictive clue first, then propagate consequences. Keep multiple valid branches until a clue eliminates one.', mistakes: 'Do not assume unstated ordering. Recheck every clue against the final arrangement.' },
    { title: 'Data interpretation', overview: 'Read the question before the chart. Identify the exact numerator, denominator, unit, and comparison needed, then calculate only that quantity.', diagram: 'chart -> required values -> formula -> estimate -> exact check', example: 'Use estimation to eliminate impossible options, then compute exactly only when two options remain close.', mistakes: 'Do not compare absolute and percentage growth interchangeably. Confirm whether a total is already cumulative.' },
  ],
  'systems-design-primer': [
    { title: 'Clarify requirements', overview: 'A strong design begins by narrowing the problem: users, actions, scale, latency, durability, consistency, and what the system explicitly will not do.', diagram: 'users -> use cases -> constraints -> success metrics', example: 'For a feed, separate publishing, following, reading, ranking, and moderation. Each path has different read/write pressure.', mistakes: 'Do not draw databases before defining access patterns. Do not claim infinite scale without a traffic estimate.' },
    { title: 'API and data modelling', overview: 'An API is a contract. Define resource identity, validation, pagination, idempotency, authorization, and error behavior before implementation details.', diagram: 'client -> gateway -> API contract -> service -> storage', example: 'An idempotency key lets a retried payment request return the original result rather than charging twice.', mistakes: 'Do not expose internal storage fields as public contracts. State which operation is safe to retry.' },
    { title: 'Storage and indexing', overview: 'Choose storage from queries and guarantees, not from popularity. Explain the primary access path and what an index costs on writes.', diagram: 'query pattern -> key/index -> partition -> record', example: 'A lookup by user and time needs a key ordered by user then timestamp; an index built for another access pattern may not help.', mistakes: 'An index does not fix a poor cardinality or an unbounded scan. Include retention and backup requirements.' },
    { title: 'Caching and delivery', overview: 'Caching reduces repeated work but introduces freshness, invalidation, and stampede problems that must be part of the design.', diagram: 'request -> cache hit\n        | miss -> source -> cache fill', example: 'Use versioned immutable assets for long public caching, but private profile responses need private cache rules and revalidation.', mistakes: 'Never say cache invalidation is free. Define TTL, eviction, stale behavior, and the source of truth.' },
    { title: 'Queues and asynchronous work', overview: 'Queues absorb bursts and separate failure domains. The design must define delivery semantics, visibility, retries, dead letters, and ordering.', diagram: 'producer -> queue -> consumer -> side effect\n             retry -> dead letter', example: 'A consumer may crash after writing data but before acknowledging a message, so handlers need idempotency.', mistakes: 'A queue is not automatically exactly-once. Explain duplicate handling and backpressure.' },
    { title: 'Scaling and reliability', overview: 'Scale the bottleneck that measurements identify, then add redundancy and failure handling without hiding correctness problems.', diagram: 'load balancer -> replicas -> partitioned data\n       metrics + logs + traces', example: 'A read-heavy service may add replicas and a cache, while a write-heavy service may need partitioning and a queue.', mistakes: 'Retries without deadlines amplify outages. Include timeouts, rate limits, graceful degradation, and recovery objectives.' },
  ],
};

function CourseLesson() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const lesson = courseLessonData[courseId ?? '']?.[Math.max(0, Number(lessonId) - 1)] ?? courseLessonData['dsa-foundations'][0];
  useEffect(() => { void recordProgress('course', { minutes: 5 }); }, [courseId, lessonId]);
  return <div className="content page-enter"><Link href="/courses" className="eyebrow"><ArrowLeft size={14} /> Courses</Link><h1 className="headline" style={{ margin: '20px 0 12px' }}>{lesson.title}</h1><p className="lede">{lesson.overview}</p><div className="split-wide" style={{ marginTop: 36, maxWidth: 1040 }}><section><div className="panel panel-pad"><div className="eyebrow">Mental model / diagram</div><pre style={{ whiteSpace: 'pre-wrap', margin: '22px 0 0', font: '12px/1.8 var(--app-font-mono)', opacity: .75 }}>{lesson.diagram}</pre></div><div className="panel panel-pad" style={{ marginTop: 14 }}><div className="eyebrow">Worked reasoning</div><p style={{ fontSize: 14, lineHeight: 1.8, opacity: .72, margin: '18px 0 0' }}>{lesson.example}</p></div></section><aside><div className="panel panel-pad"><div className="eyebrow">Common mistakes</div><p style={{ fontSize: 13, lineHeight: 1.7, opacity: .7, margin: '18px 0 0' }}>{lesson.mistakes}</p></div><div className="panel panel-pad" style={{ marginTop: 14 }}><div className="eyebrow">Checkpoint</div><p style={{ fontSize: 13, lineHeight: 1.7, opacity: .7, margin: '18px 0 0' }}>Explain the model without notes, solve one small example, and use the Practice bank to test the idea under time pressure.</p><Link href="/practice" className="btn btn-primary" style={{ marginTop: 20 }}>Open practice <ArrowRight size={14} /></Link></div></aside></div></div>;
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
    <Route path="/login" component={LoginPage} />
    <Route path="/dashboard"><Shell><Dashboard /></Shell></Route>
    <Route path="/practice"><Shell><Practice /></Shell></Route>
    <Route path="/practice/:id"><Shell><PracticeDetail /></Shell></Route>
    <Route path="/company"><Shell><Company /></Shell></Route>
    <Route path="/company/:id"><Shell><CompanyDetail /></Shell></Route>
    <Route path="/tests"><Shell><Tests /></Shell></Route>
    <Route path="/tests/:id"><Shell><TestDetail /></Shell></Route>
    <Route path="/results"><Shell><Results /></Shell></Route>
    <Route path="/core-cs"><Shell><CoreCS /></Shell></Route>
    <Route path="/core-cs/:id"><Shell><CoreCSDetail /></Shell></Route>
    <Route path="/courses/:courseId/:lessonId"><Shell><CourseLesson /></Shell></Route>
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