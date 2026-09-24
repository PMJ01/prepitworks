import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Router, type IRouter } from "express";
import {
  GetDashboardResponse,
  ListCompaniesResponse,
  ListPracticeQueryParams,
  ListPracticeResponse,
  ListTestsResponse,
  SubmitTestBody,
  SubmitTestParams,
  SubmitTestResponse,
} from "@workspace/api-zod";
import { getUserFromToken, toDashboard } from "./auth";

const router: IRouter = Router();

const practice = [
  {
    id: "two-sum",
    title: "Two Sum",
    category: "DSA",
    difficulty: "Easy",
    acceptance: 49,
    time: "15 min",
    tags: ["Arrays", "Hash Map"],
    prompt: "Given an integer array and a target, return the indices of two values that add up to the target. Each input has exactly one solution.",
    explanation: "Scan once while storing each value's index. For the current value x, the only partner that can work is target - x. A hash map gives average O(1) lookups, so the whole solution is O(n) time and O(n) space.",
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    category: "DSA",
    difficulty: "Easy",
    acceptance: 41,
    time: "12 min",
    tags: ["Stack", "Strings"],
    prompt: "Determine whether every opening bracket in a string is closed by the same type in the correct order.",
    explanation: "Use a stack for opening brackets. When a closing bracket arrives, it must match the top of the stack. The string is valid only when every match succeeds and the stack is empty at the end.",
  },
  {
    id: "merge-lists",
    title: "Merge Two Sorted Lists",
    category: "DSA",
    difficulty: "Easy",
    acceptance: 63,
    time: "18 min",
    tags: ["Linked List", "Pointers"],
    prompt: "Merge two sorted linked lists and return the head of the sorted list.",
    explanation: "A dummy head avoids special cases. Compare the current nodes, attach the smaller one, and advance that list. Append the remaining tail after one list is exhausted.",
  },
  {
    id: "best-stock",
    title: "Best Time to Buy and Sell Stock",
    category: "DSA",
    difficulty: "Easy",
    acceptance: 55,
    time: "15 min",
    tags: ["Arrays", "Greedy"],
    prompt: "Choose one day to buy and a later day to sell to maximize profit from daily prices.",
    explanation: "Keep the lowest price seen so far and compare today's price against it. The best difference is the maximum profit. This greedy scan is O(n) time with O(1) space.",
  },
  {
    id: "binary-search",
    title: "Binary Search",
    category: "DSA",
    difficulty: "Easy",
    acceptance: 58,
    time: "14 min",
    tags: ["Search", "Arrays"],
    prompt: "Find a target in a sorted array and return its index, or -1 if it is absent.",
    explanation: "Maintain inclusive left and right bounds. Compare the middle value and discard the half that cannot contain the target. Be explicit about loop invariants to avoid off-by-one errors.",
  },
  {
    id: "max-subarray",
    title: "Maximum Subarray",
    category: "DSA",
    difficulty: "Medium",
    acceptance: 52,
    time: "22 min",
    tags: ["Dynamic Programming", "Arrays"],
    prompt: "Find the contiguous subarray with the largest sum.",
    explanation: "Kadane's algorithm tracks the best sum ending at the current index. Either extend the previous subarray or start a new one at the current value. Keep a global maximum.",
  },
  {
    id: "3sum",
    title: "3Sum",
    category: "DSA",
    difficulty: "Medium",
    acceptance: 36,
    time: "30 min",
    tags: ["Sorting", "Two Pointers"],
    prompt: "Return every unique triplet that sums to zero.",
    explanation: "Sort first, then fix one value and use two pointers for the remaining pair. Skip equal values at each level so the result contains no duplicates.",
  },
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    category: "DSA",
    difficulty: "Easy",
    acceptance: 55,
    time: "16 min",
    tags: ["Dynamic Programming", "Recursion"],
    prompt: "Count the distinct ways to reach the top of n stairs when each move is one or two steps.",
    explanation: "The final step comes from n-1 or n-2, giving a Fibonacci recurrence. Store only the previous two values to keep space constant.",
  },
  {
    id: "course-schedule",
    title: "Course Schedule",
    category: "DSA",
    difficulty: "Medium",
    acceptance: 47,
    time: "28 min",
    tags: ["Graphs", "Topological Sort"],
    prompt: "Decide whether all courses can be completed given prerequisite pairs.",
    explanation: "Build an adjacency list and indegree count. Kahn's algorithm repeatedly removes zero-indegree nodes. If fewer than n nodes are processed, a cycle blocks completion.",
  },
  {
    id: "lru-cache",
    title: "LRU Cache",
    category: "DSA",
    difficulty: "Hard",
    acceptance: 39,
    time: "35 min",
    tags: ["Hash Map", "Linked List"],
    prompt: "Design a least-recently-used cache with O(1) get and put operations.",
    explanation: "Combine a hash map for direct lookup with a doubly linked list for recency order. Move accessed nodes to the front and evict the tail when capacity is exceeded.",
  },
  {
    id: "sql-joins",
    title: "Employee Department Join",
    category: "Core CS",
    difficulty: "Medium",
    acceptance: 44,
    time: "20 min",
    tags: ["SQL", "Joins"],
    prompt: "Write a query that returns every employee's name, department, and salary, including employees without an assigned department.",
    explanation: "Use a LEFT JOIN from employees to departments so unmatched employees remain in the result. Add explicit column names and an ORDER BY salary to make output deterministic.",
  },
  {
    id: "os-deadlock",
    title: "Deadlock Detection",
    category: "Core CS",
    difficulty: "Medium",
    acceptance: 61,
    time: "18 min",
    tags: ["Operating Systems", "Concurrency"],
    prompt: "Explain the four Coffman conditions and identify which scheduling changes can prevent deadlock.",
    explanation: "Deadlock requires mutual exclusion, hold and wait, no preemption, and circular wait. Breaking any one condition prevents it; resource ordering is a common practical strategy.",
  },
  {
    id: "http-cache",
    title: "HTTP Cache-Control",
    category: "Core CS",
    difficulty: "Easy",
    acceptance: 67,
    time: "10 min",
    tags: ["Networking", "Web"],
    prompt: "Choose cache headers for a versioned static asset and a private user profile response.",
    explanation: "Versioned assets can use public immutable caching because the URL changes when content changes. User profiles should be private and revalidated to avoid leaking personalized data.",
  },
  {
    id: "probability-cards",
    title: "Conditional Probability",
    category: "Aptitude",
    difficulty: "Easy",
    acceptance: 72,
    time: "12 min",
    tags: ["Probability", "Aptitude"],
    prompt: "A box contains red and blue cards. Derive the probability of a red card after a blue card was already removed.",
    explanation: "Update the sample space after the first event. Conditional probability is P(A|B) = P(A and B) / P(B); do not reuse the original denominator once an item is removed.",
  },
  {
    id: "pipes-tanks",
    title: "Pipes and Tanks",
    category: "Aptitude",
    difficulty: "Easy",
    acceptance: 68,
    time: "14 min",
    tags: ["Ratios", "Work"],
    prompt: "Two pipes fill a tank in different times. Find the combined fill time and account for an outlet.",
    explanation: "Convert each time into a rate per minute. Add inlet rates and subtract outlet rates, then invert the final rate to get the total time.",
  },
  {
    id: "system-design-url",
    title: "Design a URL Shortener",
    category: "System Design",
    difficulty: "Medium",
    acceptance: 32,
    time: "40 min",
    tags: ["Architecture", "Databases"],
    prompt: "Design a highly available URL shortener that supports redirects, analytics, and expiry.",
    explanation: "Start with the redirect read path, then choose a collision-safe key generator, a durable mapping store, cache hot links, and queue analytics so tracking never slows redirects.",
  },
  {
    id: "producer-consumer",
    title: "Producer Consumer",
    category: "Core CS",
    difficulty: "Medium",
    acceptance: 49,
    time: "24 min",
    tags: ["Concurrency", "Queues"],
    prompt: "Implement a bounded producer-consumer queue with correct wait and signal behavior.",
    explanation: "Protect the buffer with a lock and use condition variables for not-empty and not-full. Always wait in a loop because wakeups do not guarantee the predicate is true.",
  },
  {
    id: "word-break",
    title: "Word Break",
    category: "DSA",
    difficulty: "Medium",
    acceptance: 46,
    time: "26 min",
    tags: ["Dynamic Programming", "Strings"],
    prompt: "Determine whether a string can be segmented into dictionary words.",
    explanation: "Let dp[i] mean the prefix ending before i is segmentable. For every end position, try dictionary words that could end there and build from a known true prefix.",
  },
  {
    id: "binary-tree-level",
    title: "Binary Tree Level Order",
    category: "DSA",
    difficulty: "Medium",
    acceptance: 71,
    time: "20 min",
    tags: ["Trees", "BFS"],
    prompt: "Return the values of a binary tree grouped by depth.",
    explanation: "A queue naturally models breadth-first traversal. Process the queue's current length as one level, enqueue children, and repeat until empty.",
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    category: "DSA",
    difficulty: "Medium",
    acceptance: 48,
    time: "24 min",
    tags: ["Sorting", "Intervals"],
    prompt: "Merge every overlapping interval in a list.",
    explanation: "Sort by start time. Compare each interval with the last merged interval; extend its end when they overlap, otherwise start a new merged block.",
  },
  {
    id: "fizzbuzz",
    title: "FizzBuzz",
    category: "DSA",
    difficulty: "Easy",
    acceptance: 78,
    time: "8 min",
    tags: ["Loops", "Implementation"],
    prompt: "Print numbers from 1 to n, replacing multiples of three and five with their words.",
    explanation: "Check divisibility by 15 before checking 3 or 5. A small string builder keeps the implementation readable and avoids overlapping output rules.",
  },
] as const;

const companies = [
  {
    id: "tcs",
    name: "TCS NQT",
    logo: "T",
    accent: "02",
    rounds: 4,
    applicants: "3.2M annual",
    focus: "Aptitude, coding, communication",
    overview: "TCS NQT commonly moves from a general ability screen into advanced quantitative reasoning, a coding section, and a final interview. The safest preparation plan balances speed with clean fundamentals.",
    plan: [
      "Round 01 · Foundation: numerical ability, verbal ability, reasoning, and basic data interpretation.",
      "Round 02 · Advanced: tougher reasoning sets and pattern recognition under strict time pressure.",
      "Round 03 · Coding: arrays, strings, sorting, recursion, SQL, and one medium implementation problem.",
      "Round 04 · Interview: project walkthrough, OOP basics, operating systems, DBMS, and communication.",
    ],
  },
  {
    id: "amazon",
    name: "Amazon",
    logo: "A",
    accent: "AM",
    rounds: 5,
    applicants: "1.6M annual",
    focus: "DSA, system design, leadership",
    overview: "Amazon interviews reward structured problem solving and clear trade-offs. Expect a screening assessment, coding rounds, system design for experienced candidates, and behavioral questions mapped to Leadership Principles.",
    plan: [
      "Round 01 · Online assessment: debugging, work simulation, and timed DSA.",
      "Round 02 · Phone screen: one or two coding problems with complexity analysis.",
      "Round 03 · Loop coding: graphs, trees, dynamic programming, and edge-case reasoning.",
      "Round 04 · Design: APIs, data stores, queues, scaling, observability, and failure modes.",
      "Round 05 · Behavioral: ownership, customer obsession, disagree and commit, and delivering results.",
    ],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    logo: "M",
    accent: "MS",
    rounds: 4,
    applicants: "900K annual",
    focus: "Problem solving, CS core, collaboration",
    overview: "Microsoft screens for strong fundamentals and the ability to communicate while solving. Candidates should be comfortable with trees, graphs, design basics, and explaining decisions to a teammate.",
    plan: [
      "Round 01 · Online screen: coding correctness, complexity, and practical debugging.",
      "Round 02 · Technical 1: arrays, strings, linked lists, and binary trees.",
      "Round 03 · Technical 2: graphs, concurrency, APIs, and object-oriented design.",
      "Round 04 · Final loop: project depth, collaboration stories, and role-specific fundamentals.",
    ],
  },
  {
    id: "infosys",
    name: "Infosys",
    logo: "I",
    accent: "IN",
    rounds: 4,
    applicants: "2.1M annual",
    focus: "Aptitude, pseudocode, coding",
    overview: "Infosys assessments place a premium on speed, output tracing, and basic programming fluency. A repeatable test routine is more valuable than memorizing isolated tricks.",
    plan: [
      "Round 01 · Reasoning: logical deductions, data sufficiency, and analytical puzzles.",
      "Round 02 · Verbal and quantitative: grammar, arithmetic, percentages, and time-work problems.",
      "Round 03 · Pseudocode: loops, arrays, strings, and debugging output.",
      "Round 04 · Interview: resume walkthrough, OOP, DBMS, networking, and willingness to learn.",
    ],
  },
  {
    id: "google",
    name: "Google",
    logo: "G",
    accent: "GO",
    rounds: 5,
    applicants: "1.0M annual",
    focus: "Algorithms, design, clarity",
    overview: "Google-style preparation is about reducing ambiguity. Practice narrating brute force first, proving the improvement, and checking constraints before writing code.",
    plan: [
      "Round 01 · Assessment: algorithmic reasoning and implementation under time limits.",
      "Round 02 · Coding screen: one large problem with follow-up constraints.",
      "Round 03 · Onsite coding: graphs, dynamic programming, strings, and mathematical modeling.",
      "Round 04 · Design: distributed systems, interfaces, storage, and reliability.",
      "Round 05 · Behavioral: teamwork, ambiguity, feedback, and impact.",
    ],
  },
] as const;

const tests = [
  { id: "google-screen", title: "Google phone screen", company: "Google", type: "Coding screen", questions: 3, duration: 45, difficulty: "Medium", description: "Three problems that test decomposition, edge cases, and how you communicate under time." },
  { id: "tcs-foundation", title: "TCS Foundation Sprint", company: "TCS NQT", type: "Aptitude + CS", questions: 10, duration: 25, difficulty: "Foundation", description: "A fast mixed set covering quantitative ability, reasoning, SQL, OOP, and one coding trace." },
  { id: "tcs-coding", title: "TCS Coding Capsule", company: "TCS NQT", type: "Coding", questions: 8, duration: 35, difficulty: "Intermediate", description: "Timed array, string, recursion, and implementation questions with interview-style explanations." },
  { id: "amazon-dsa", title: "Amazon DSA Screen", company: "Amazon", type: "Algorithms", questions: 12, duration: 45, difficulty: "Advanced", description: "A company-style screen focused on trees, graphs, intervals, dynamic programming, and complexity." },
  { id: "microsoft-core", title: "Microsoft Core CS Check", company: "Microsoft", type: "Core CS", questions: 10, duration: 30, difficulty: "Intermediate", description: "Operating systems, DBMS, networking, OOP, and practical debugging scenarios." },
  { id: "google-logic", title: "Google Reasoning Lab", company: "Google", type: "Algorithms", questions: 9, duration: 40, difficulty: "Advanced", description: "Constraint-led algorithmic reasoning with follow-ups that test whether your solution scales." },
] as const;

const generatedPracticeTopics = [
  ["DSA", "Two Pointer Window", "Arrays"],
  ["DSA", "Prefix Sum Queries", "Arrays"],
  ["DSA", "Monotonic Stack Prices", "Stacks"],
  ["DSA", "Sliding Window Frequency", "Strings"],
  ["DSA", "Merge Sorted Sequences", "Linked Lists"],
  ["DSA", "Reverse Nodes by Group", "Linked Lists"],
  ["DSA", "Clone Graph", "Graphs"],
  ["DSA", "Bipartite Coloring", "Graphs"],
  ["DSA", "Shortest Path Grid", "Graphs"],
  ["DSA", "Minimum Spanning Network", "Graphs"],
  ["DSA", "Topological Course Order", "Graphs"],
  ["DSA", "Binary Tree Diameter", "Trees"],
  ["DSA", "Serialize Binary Tree", "Trees"],
  ["DSA", "Kth Smallest Tree Node", "Trees"],
  ["DSA", "Trie Prefix Search", "Tries"],
  ["DSA", "Heap Top K Values", "Heaps"],
  ["DSA", "Meeting Room Schedule", "Intervals"],
  ["DSA", "Subsets with Duplicates", "Backtracking"],
  ["DSA", "Word Search Grid", "Backtracking"],
  ["DSA", "Partition Equal Sum", "Dynamic Programming"],
  ["DSA", "Coin Change Count", "Dynamic Programming"],
  ["DSA", "Edit Distance Table", "Dynamic Programming"],
  ["DSA", "Longest Increasing Run", "Dynamic Programming"],
  ["DSA", "Bitwise Unique Element", "Bit Manipulation"],
  ["DSA", "Count Set Bits", "Bit Manipulation"],
  ["Core CS", "Page Replacement Trace", "Operating Systems"],
  ["Core CS", "Deadlock Safe State", "Operating Systems"],
  ["Core CS", "Process Scheduling", "Operating Systems"],
  ["Core CS", "B Tree Index Lookup", "DBMS"],
  ["Core CS", "Transaction Isolation", "DBMS"],
  ["Core CS", "Query Plan Cost", "DBMS"],
  ["Core CS", "DNS Resolution Path", "Networks"],
  ["Core CS", "TCP Congestion Window", "Networks"],
  ["Core CS", "HTTP Cache Policy", "Networks"],
  ["Core CS", "Interface Segregation Design", "OOP"],
  ["Core CS", "Garbage Collection Trace", "OOP"],
  ["Aptitude", "Percentage Change Drill", "Quantitative"],
  ["Aptitude", "Profit Loss Set", "Quantitative"],
  ["Aptitude", "Probability Cards", "Probability"],
  ["Aptitude", "Syllogism Validation", "Reasoning"],
  ["Aptitude", "Number Series Pattern", "Reasoning"],
  ["Aptitude", "Data Interpretation Table", "Data Interpretation"],
  ["System Design", "Rate Limiter Blueprint", "Architecture"],
  ["System Design", "Event Queue Blueprint", "Architecture"],
  ["System Design", "Search Autocomplete", "Architecture"],
] as const;

const generatedPractice = Array.from({ length: 200 }, (_, index) => {
  const number = index + 1;
  const [category, title, topic] = generatedPracticeTopics[index % generatedPracticeTopics.length];
  const difficulty = index % 5 === 0 ? "Hard" : index % 3 === 0 ? "Medium" : "Easy";
  return {
    id: `${title.toLowerCase().replaceAll(" ", "-")}-${number}`,
    title: `${title} ${number}`,
    category,
    difficulty,
    acceptance: 31 + ((index * 7) % 48),
    time: `${12 + (index % 6) * 5} min`,
    tags: [topic, category === "DSA" ? "Problem solving" : "Interview prep"],
    prompt: `Work through ${title.toLowerCase()} with explicit constraints, a baseline approach, and a tested improvement. Explain how your ${topic.toLowerCase()} choice changes the time and space cost.`,
    explanation: `Start by stating the invariant for this ${topic.toLowerCase()} problem. Write a small example, identify the operation that repeats, and choose the data structure that makes that operation predictable. Then test the boundary cases: empty input, a single value, duplicates, and the largest practical input. A strong interview answer names the baseline, proves why the optimized approach is correct, and reports complexity in terms of the input size.`,
  };
});

const allPractice = [...practice, ...generatedPractice];

router.get("/dashboard", async (req, res) => {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const user = await getUserFromToken(token);
  if (user) {
    res.json(GetDashboardResponse.parse(toDashboard(user)));
    return;
  }

  res.json(GetDashboardResponse.parse({
    readiness: 68,
    solved: 142,
    streak: 14,
    studyMinutes: 386,
    continueTopic: "Dynamic programming",
    heatmap: [
      { topic: "Arrays", score: 86 },
      { topic: "Trees", score: 71 },
      { topic: "DP", score: 54 },
      { topic: "Graphs", score: 44 },
      { topic: "Core CS", score: 77 },
    ],
  }));
});

router.get("/practice", (req, res) => {
  const parsed = ListPracticeQueryParams.parse(req.query);
  const search = parsed.search?.toLowerCase();
  const filtered = allPractice.filter((question) => {
    const matchesCategory = !parsed.category || parsed.category === "All" || question.category === parsed.category;
    const matchesDifficulty = !parsed.difficulty || parsed.difficulty === "All" || question.difficulty === parsed.difficulty;
    const text = `${question.title} ${question.tags.join(" ")} ${question.prompt}`.toLowerCase();
    return matchesCategory && matchesDifficulty && (!search || text.includes(search));
  });
  res.json(ListPracticeResponse.parse(filtered));
});

router.get("/companies", (_req, res) => {
  res.json(ListCompaniesResponse.parse(companies));
});

router.get("/tests", (_req, res) => {
  res.json(ListTestsResponse.parse(tests));
});

router.post("/tests/:testId/submit", (req, res) => {
  const { testId } = SubmitTestParams.parse(req.params);
  const { answers } = SubmitTestBody.parse(req.body);
  const test = tests.find((candidate) => candidate.id === testId) ?? tests[0];
  const answered = Object.values(answers).filter((value) => value >= 0).length;
  const score = Math.min(test.questions, Math.max(0, Math.round(answered * 0.7)));
  const percentage = Math.round((score / test.questions) * 100);
  const recommendation = percentage >= 80
    ? "Strong attempt. Move to timed company-specific sets and practise explaining your trade-offs aloud."
    : percentage >= 55
      ? "Good base. Revisit the missed concepts, then repeat this test without looking at notes."
      : "Rebuild the fundamentals first. Use the practice vault to close one topic gap before retaking.";
  res.json(SubmitTestResponse.parse({ score, total: test.questions, percentage, recommendation }));
});

function runLocalProcess(command: string, args: string[], cwd: string) {
  return new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve) => {
    const child = spawn(command, args, { cwd, shell: false });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 5000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => { clearTimeout(timer); resolve({ stdout, stderr: error.message, code: 1 }); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ stdout, stderr, code }); });
  });
}

const javaHome = process.env.JAVA_HOME ?? "/opt/homebrew/opt/openjdk";
const javaCompiler = join(javaHome, "bin", "javac");
const javaRuntime = join(javaHome, "bin", "java");
const goRuntime = process.env.GO_PATH ?? "/opt/homebrew/bin/go";

router.post("/compile", async (req, res) => {
  const language = typeof req.body?.language === "string" ? req.body.language : "";
  const code = typeof req.body?.code === "string" ? req.body.code : "";

  if (!["python", "java", "cpp", "javascript", "go"].includes(language) || !code.trim() || code.length > 20000) {
    res.status(400).json({ error: "Choose a supported language and provide code under 20,000 characters." });
    return;
  }

  const directory = await mkdtemp(join(tmpdir(), "prepitworks-"));
  try {
    if (language === "python") {
      await writeFile(join(directory, "main.py"), code, "utf8");
      const result = await runLocalProcess("python3", ["main.py"], directory);
      res.json({ output: result.stdout, error: result.stderr });
      return;
    }
    if (language === "javascript") {
      await writeFile(join(directory, "main.js"), code, "utf8");
      const result = await runLocalProcess("node", ["main.js"], directory);
      res.json({ output: result.stdout, error: result.stderr });
      return;
    }
    if (language === "cpp") {
      await writeFile(join(directory, "main.cpp"), code, "utf8");
      const compile = await runLocalProcess("g++", ["main.cpp", "-std=c++20", "-O0", "-o", "main"], directory);
      if (compile.code !== 0) {
        res.json({ output: compile.stdout, error: compile.stderr });
        return;
      }
      const result = await runLocalProcess(join(directory, "main"), [], directory);
      res.json({ output: result.stdout, error: result.stderr });
      return;
    }
    if (language === "go") {
      await writeFile(join(directory, "main.go"), code, "utf8");
      const result = await runLocalProcess(goRuntime, ["run", "main.go"], directory);
      res.json({ output: result.stdout, error: result.stderr });
      return;
    }
    await writeFile(join(directory, "Main.java"), code, "utf8");
    const compile = await runLocalProcess(javaCompiler, ["Main.java"], directory);
    if (compile.code !== 0) {
      res.json({ output: compile.stdout, error: compile.stderr });
      return;
    }
    const result = await runLocalProcess(javaRuntime, ["-cp", directory, "Main"], directory);
    res.json({ output: result.stdout, error: result.stderr });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Compiler error." });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

export default router;