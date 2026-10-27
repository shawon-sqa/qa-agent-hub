import {
  Globe,
  FileCheck2,
  Workflow,
  ClipboardCheck,
  ListChecks,
  Layers,
  UserCheck,
  Bug,
  Network,
  PlayCircle,
  ShieldCheck,
  Zap,
  FolderKanban,
  Cpu,
} from "lucide-react";
import { NavItem, QuickStat, QAProject, AgentActivity, UserProfile } from "@/types/dashboard";

export const NAVIGATION_ITEMS: NavItem[] = [
  // 1. ANALYSIS & REQUIREMENTS
  {
    id: "website-analysis",
    label: "Website Analysis",
    icon: Globe,
    category: "ANALYSIS & REQUIREMENTS",
  },
  {
    id: "requirements",
    label: "System Requirements",
    icon: FileCheck2,
    category: "ANALYSIS & REQUIREMENTS",
  },
  {
    id: "business-flows",
    label: "Business Flows",
    icon: Workflow,
    category: "ANALYSIS & REQUIREMENTS",
  },
  {
    id: "functional-qa",
    label: "Functional QA",
    icon: ClipboardCheck,
    category: "ANALYSIS & REQUIREMENTS",
  },

  // 2. TEST MANAGEMENT
  {
    id: "test-cases",
    label: "Test Cases",
    icon: ListChecks,
    category: "TEST MANAGEMENT",
  },
  {
    id: "test-suites",
    label: "Test Suites",
    icon: Layers,
    category: "TEST MANAGEMENT",
  },
  {
    id: "manual-qa",
    label: "Manual QA",
    icon: UserCheck,
    category: "TEST MANAGEMENT",
  },
  {
    id: "defect-management",
    label: "Defect Management",
    icon: Bug,
    category: "TEST MANAGEMENT",
  },

  // 3. AUTOMATION & SECURITY
  {
    id: "api-testing",
    label: "API Testing",
    icon: Network,
    category: "AUTOMATION & SECURITY",
  },
  {
    id: "playwright-automation",
    label: "Playwright Automation",
    icon: PlayCircle,
    category: "AUTOMATION & SECURITY",
  },
  {
    id: "security-testing",
    label: "Security Testing",
    icon: ShieldCheck,
    category: "AUTOMATION & SECURITY",
  },
  {
    id: "performance-testing",
    label: "Performance Testing",
    icon: Zap,
    category: "AUTOMATION & SECURITY",
  },
];

export const CURRENT_USER: UserProfile = {
  name: "Shawon Ahmed",
  email: "shawon@qa-agent-hub.io",
  role: "Lead QA Engineer & Admin",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
  status: "online",
};

export const QUICK_STATS: QuickStat[] = [
  {
    id: "total-tests",
    title: "Total Test Cases",
    value: "1,428",
    change: "+12.4%",
    trend: "up",
    description: "98.2% automated test coverage across suites",
    icon: ListChecks,
    accentColor: "from-blue-600 to-indigo-600",
  },
  {
    id: "active-projects",
    title: "Active QA Projects",
    value: "14",
    change: "+2 this month",
    trend: "up",
    description: "8 production targets, 6 staging environments",
    icon: FolderKanban,
    accentColor: "from-cyan-600 to-blue-600",
  },
  {
    id: "playwright-runs",
    title: "Playwright Runs (24h)",
    value: "84 Runs",
    change: "99.1% Pass",
    trend: "up",
    description: "Average execution time: 3m 42s",
    icon: Cpu,
    accentColor: "from-emerald-600 to-teal-600",
  },
  {
    id: "open-bugs",
    title: "Open Bug Reports",
    value: "7",
    change: "-4 resolved",
    trend: "down",
    description: "2 critical, 5 minor issues tracked",
    icon: Bug,
    accentColor: "from-rose-500 to-amber-600",
  },
];

export const RECENT_PROJECTS: QAProject[] = [
  {
    id: "proj-1",
    name: "FinTech Banking Portal",
    domain: "app.securebank.com",
    environment: "Production",
    passRate: 99.4,
    totalTests: 420,
    lastRun: "12 mins ago",
    status: "Passed",
    assignedAgent: "Playwright AI Worker #1",
  },
  {
    id: "proj-2",
    name: "E-Commerce Checkout Flow",
    domain: "shop.luxwear.store",
    environment: "Staging",
    passRate: 94.2,
    totalTests: 310,
    lastRun: "38 mins ago",
    status: "Warning",
    assignedAgent: "Flow Validator #4",
  },
  {
    id: "proj-3",
    name: "Healthcare Provider Portal",
    domain: "portal.carepulse.org",
    environment: "Production",
    passRate: 100,
    totalTests: 285,
    lastRun: "1 hour ago",
    status: "Passed",
    assignedAgent: "Security Scanner #2",
  },
  {
    id: "proj-4",
    name: "SaaS Analytics Dashboard",
    domain: "insights.metricsphere.io",
    environment: "Dev",
    passRate: 78.5,
    totalTests: 190,
    lastRun: "Running now",
    status: "Running",
    assignedAgent: "Regression Agent #3",
  },
  {
    id: "proj-5",
    name: "Auth & Identity microservice",
    domain: "auth.identitycloud.dev",
    environment: "Staging",
    passRate: 91.8,
    totalTests: 223,
    lastRun: "3 hours ago",
    status: "Failed",
    assignedAgent: "API Tester #1",
  },
];

export const RECENT_ACTIVITIES: AgentActivity[] = [
  {
    id: "act-1",
    agentName: "Playwright Automation Agent",
    action: "Executed End-to-End Suite",
    target: "FinTech Banking / Login & 2FA Flow",
    timestamp: "6 mins ago",
    status: "success",
  },
  {
    id: "act-2",
    agentName: "AI Flow Discovery",
    action: "Detected new checkout cart edge case",
    target: "E-Commerce Checkout / Coupon Application",
    timestamp: "24 mins ago",
    status: "warning",
  },
  {
    id: "act-3",
    agentName: "Security Vulnerability Scan",
    action: "Penetration test & header audit passed",
    target: "Healthcare Provider Portal / API Gateway",
    timestamp: "1 hour ago",
    status: "success",
  },
  {
    id: "act-4",
    agentName: "Regression Agent #3",
    action: "Running automated Playwright smoke tests",
    target: "SaaS Analytics Dashboard",
    timestamp: "In progress",
    status: "in_progress",
  },
];
