'use client';

import React, { useState } from 'react';
import {
  Send,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Search,
  Globe,
  Mail,
  ShieldCheck,
  TrendingUp,
  Flame,
  Bot,
  Users,
} from 'lucide-react';

export default function Dashboard() {
  const [autonomyTier, setAutonomyTier] = useState<0 | 1 | 2>(1);
  const [scrapeQuery, setScrapeQuery] = useState('AI software agencies');
  const [scrapeLocation, setScrapeLocation] = useState('Austin, TX');
  const [scrapeProvider, setScrapeProvider] = useState<'GOOGLE_MAPS' | 'APIFY'>('GOOGLE_MAPS');
  const [extractEmails, setExtractEmails] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeSuccess, setScrapeSuccess] = useState(false);

  const handleTriggerScrape = () => {
    setIsScraping(true);
    setScrapeSuccess(false);
    setTimeout(() => {
      setIsScraping(false);
      setScrapeSuccess(true);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0c1220]/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-black" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Predictive Distribution System
            </span>
            <span className="ml-2.5 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Agency v1 (Dogfooding + SaaS)
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm text-slate-400">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-slate-300">Caddy CTD Active</span>
          </div>
          <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
            Host: $12/mo VPS (RAM: 312MB)
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0e1626] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Sent Today</span>
              <Send className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">184 / 200</div>
            <div className="text-xs text-slate-400 mt-2 flex items-center space-x-1">
              <span className="text-emerald-400 font-semibold">92%</span>
              <span>of daily safe pool capacity</span>
            </div>
          </div>

          <div className="bg-[#0e1626] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Open Rate (CTD)</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">68.4%</div>
            <div className="text-xs text-slate-400 mt-2 flex items-center space-x-1">
              <span className="text-blue-400 font-semibold">+14.2%</span>
              <span>via isolated CNAME domain</span>
            </div>
          </div>

          <div className="bg-[#0e1626] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Reply Rate</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">14.8%</div>
            <div className="text-xs text-slate-400 mt-2 flex items-center space-x-1">
              <span className="text-amber-400 font-semibold">27 positive replies</span>
              <span>this week</span>
            </div>
          </div>

          <div className="bg-[#0e1626] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Sending Inboxes</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">5 / 5 Healthy</div>
            <div className="text-xs text-slate-400 mt-2 flex items-center space-x-1">
              <span className="text-emerald-400 font-semibold">100%</span>
              <span>SPF, DKIM, DMARC passed</span>
            </div>
          </div>
        </div>

        {/* AI Autonomy Slider (Configurable Control) */}
        <div className="bg-[#0e1626] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Bot className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="font-semibold text-base text-white">Configurable AI Autonomy Control</h2>
                <p className="text-xs text-slate-400">
                  Dial in how aggressively AI personalizes cold email hooks for your agency or SaaS clients.
                </p>
              </div>
            </div>
            <div className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
              BYOK Mode: DeepSeek / OpenAI
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {/* Tier 0 */}
            <button
              type="button"
              onClick={() => setAutonomyTier(0)}
              className={`p-4 rounded-xl border text-left transition ${
                autonomyTier === 0
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">Tier 0: Deterministic</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">$0.00 / mo</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                100% Spintax & mustache tags. Zero LLM API calls, instant execution, zero hallucination risk.
              </p>
            </button>

            {/* Tier 1 */}
            <button
              type="button"
              onClick={() => setAutonomyTier(1)}
              className={`p-4 rounded-xl border text-left transition ${
                autonomyTier === 1
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">Tier 1: Copilot (HITL)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-medium">Recommended</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                AI analyzes scraped Google Maps / website data and drafts tailored hooks. Human approves batch before dispatch.
              </p>
            </button>

            {/* Tier 2 */}
            <button
              type="button"
              onClick={() => setAutonomyTier(2)}
              className={`p-4 rounded-xl border text-left transition ${
                autonomyTier === 2
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">Tier 2: Autonomous</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">High Velocity</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Dynamic generation on queue pickup with strict length & tone guardrails. Auto-fallback to Tier 0 on error.
              </p>
            </button>
          </div>
        </div>

        {/* Lead Scraper Engine Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0e1626] border border-slate-800/80 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Search className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="font-semibold text-base text-white">Configurable Lead Scraper</h2>
                  <p className="text-xs text-slate-400">
                    Extract local businesses & direct emails via Google Maps API, Apify, and built-in website crawler.
                  </p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                Zero Email-Finder Fees
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Business Niche / Query</label>
                <input
                  type="text"
                  value={scrapeQuery}
                  onChange={(e) => setScrapeQuery(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Dental clinics, Shopify agencies"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Location / City</label>
                <input
                  type="text"
                  value={scrapeLocation}
                  onChange={(e) => setScrapeLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Austin, TX or London, UK"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Provider:</span>
                  <select
                    value={scrapeProvider}
                    onChange={(e: any) => setScrapeProvider(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="GOOGLE_MAPS">Google Maps (Places API)</option>
                    <option value="APIFY">Apify Actor (BYOK)</option>
                  </select>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={extractEmails}
                    onChange={(e) => setExtractEmails(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-0"
                  />
                  <span>Crawl website for verified business emails</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleTriggerScrape}
                disabled={isScraping}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-semibold text-xs flex items-center space-x-2 hover:opacity-95 transition disabled:opacity-50"
              >
                {isScraping ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Scraping & Crawling...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Launch Scrape Job</span>
                  </>
                )}
              </button>
            </div>

            {scrapeSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Discovered <strong>48 businesses</strong> in {scrapeLocation} with <strong>36 verified public emails</strong> extracted from websites!
                  </span>
                </div>
                <button type="button" className="underline font-semibold hover:text-white">
                  Enroll into Campaign &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Inbox Pool Status */}
          <div className="bg-[#0e1626] border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base text-white">Inbox Pool Health</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                5 Inboxes
              </span>
            </div>

            <div className="space-y-3">
              {[
                { email: 'alex@reach-devagency.com', sent: '38/40', dmarc: true },
                { email: 'sarah@grow-devagency.com', sent: '37/40', dmarc: true },
                { email: 'team@connect-devagency.com', sent: '40/40', dmarc: true },
                { email: 'contact@partner-devagency.com', sent: '35/40', dmarc: true },
                { email: 'inbound@hire-devagency.com', sent: '34/40', dmarc: true },
              ].map((inbox, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate text-slate-200">{inbox.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-2">
                    <span className="font-mono text-slate-400">{inbox.sent}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                      DMARC OK
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
