import React from 'react';
import { Github, GitBranch, GitPullRequest, Tag, CheckCircle2, Shield, Play, Terminal, ExternalLink, Bookmark } from 'lucide-react';

export const SCMCenter: React.FC = () => {
  const repoUrl = 'https://github.com/HarishL496/ccb-simulator';

  const scmFunctionalities = [
    {
      num: 1,
      title: 'Repository Structure & SCM Configuration',
      desc: 'Monorepo containing Express backend, Vite React frontend, SQLite persistence, and docs/evidence directory.',
      evidence: 'docs/evidence/01-dashboard.png, package.json, schema migrations',
    },
    {
      num: 2,
      title: 'Branching Strategy & Workflows',
      desc: 'Feature branching workflow (main, develop, feature/ci-registry, feature/ccb-approvals).',
      evidence: 'docs/evidence/16-github-branch-protection.png, git branch model',
    },
    {
      num: 3,
      title: 'Formal Change Requests & Issue Templates',
      desc: 'Structured GitHub Issue templates for Change Requests (CR) and Problem Reports (PR) matching CCB schema.',
      evidence: '.github/ISSUE_TEMPLATE/change-request.yml, problem-report.yml',
    },
    {
      num: 4,
      title: 'Commit Traceability & Conventional Messages',
      desc: 'Standardized conventional commits (feat, fix, docs, chore) linking directly to CR numbers.',
      evidence: 'docs/evidence/11-github-commits.png, git log',
    },
    {
      num: 5,
      title: 'Pull Requests & Peer Review Approval',
      desc: 'Pull Request workflow with required reviews, CCB board sign-off, and automated checks before merge.',
      evidence: 'docs/evidence/12-github-pull-request.png',
    },
    {
      num: 6,
      title: 'Milestone Baselines & Release Tagging',
      desc: 'Immutable semantic version tags marking official baseline releases (v1.0.0-review2, v1.1.0-review3).',
      evidence: 'docs/evidence/13-github-tags.png, baselines table snapshot',
    },
    {
      num: 7,
      title: 'Automated CI/CD Pipeline',
      desc: 'GitHub Actions workflow executing linting, TypeScript type-checking, Jest test suites, and build validation.',
      evidence: '.github/workflows/ci.yml, docs/evidence/15-github-actions.png',
    },
    {
      num: 8,
      title: 'Branch Protection & Governance Policies',
      desc: 'Branch protection rules on `main` enforcing PR reviews, passing CI status checks, and linear history.',
      evidence: 'docs/evidence/16-github-branch-protection.png',
    },
    {
      num: 9,
      title: 'Configuration Status Accounting & SCM Audits',
      desc: 'Live CSA matrix by category, CSV exports, and Functional & Physical Configuration Audits (FCA/PCA).',
      evidence: 'docs/evidence/06-status-accounting.png, docs/evidence/20-audit-report.png',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">SCM Centre & SWEBOK Evidence</h2>
          <p className="text-sm text-slate-500 mt-1">
            Documentation of the 9 Software Configuration Management functionalities for ISWE403L Review 3.
          </p>
        </div>
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Github className="w-4 h-4 mr-2" />
          View GitHub Repository
          <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
        </a>
      </div>

      {/* GitHub Repository Info Card */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-sm text-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Github className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm text-white">HarishL496 / ccb-simulator</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            Repository Configured & SCM Ready
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px]">
          <div>
            <span className="text-slate-400 block">Repository Remote:</span>
            <span className="font-mono text-slate-200 truncate block mt-0.5">{repoUrl}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Primary Branch:</span>
            <span className="font-mono text-indigo-300 font-semibold mt-0.5 block">main (protected)</span>
          </div>
          <div>
            <span className="text-slate-400 block">CI Automation:</span>
            <span className="text-slate-200 mt-0.5 block">GitHub Actions (.github/workflows/ci.yml)</span>
          </div>
          <div>
            <span className="text-slate-400 block">Baseline Release Tag:</span>
            <span className="font-mono text-purple-300 font-semibold mt-0.5 block">v1.1.0-review3</span>
          </div>
        </div>
      </div>

      {/* 9 SCM Functionalities Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Review 3 — Nine SCM Functionalities Evidence Matrix
          </h3>
          <span className="text-[11px] text-slate-500 font-semibold">IEEE 828 Standards Compliance</span>
        </div>

        <div className="divide-y divide-slate-100">
          {scmFunctionalities.map((func) => (
            <div key={func.num} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="flex items-start space-x-3.5 max-w-2xl">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-indigo-200">
                  {func.num}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{func.title}</h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{func.desc}</p>
                </div>
              </div>

              <div className="flex-shrink-0 text-right md:w-72">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Evidence Artifact:</span>
                <span className="font-mono text-[11px] text-slate-700 block truncate mt-0.5">{func.evidence}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
