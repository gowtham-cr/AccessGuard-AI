import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, Shield, Info, CheckCircle, HeartHandshake, Mic, ShieldAlert } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    {
      name: 'Overview',
      to: '/dashboard',
      icon: LayoutDashboard,
      description: 'Compliance metrics & recent audits',
    },
    {
      name: 'Safety Shield',
      to: '/safety-shield',
      icon: ShieldAlert,
      description: 'Check suspicious messages & links for seniors',
    },
    {
      name: 'AccessVoice AI',
      to: '/voice-assistant',
      icon: Mic,
      description: 'Voice-guided scholarship assistant for blind users',
    },
    {
      name: 'Launch Scan',
      to: '/scans/new',
      icon: PlusCircle,
      description: 'Run real Playwright + axe-core audit',
    },
    {
      name: 'Audit History',
      to: '/history',
      icon: History,
      description: 'Full record of past evaluations',
    },
    {
      name: 'Citizen Guide',
      to: '/citizen',
      icon: HeartHandshake,
      description: 'Bilingual citizen guidance (ಕನ್ನಡ / English)',
    },
  ];

  return (
    <aside 
      aria-label="Dashboard navigation"
      className="w-full lg:w-64 bg-slate-950/40 backdrop-blur-2xl border-r border-white/10 flex flex-col justify-between p-4 shrink-0 shadow-2xl"
    >
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
            Main Navigation
          </span>
          <nav className="mt-2 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-purple-400 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-bold shadow-lg shadow-purple-500/35 border border-purple-400/40'
                        : 'text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/10 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Security & Integrity Status Box */}
        <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-purple-300 text-xs font-bold">
            <Shield className="w-4 h-4 text-purple-400" aria-hidden="true" />
            <span>Integrity System</span>
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1.5 leading-tight">
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-cyan-400 shrink-0" aria-hidden="true" />
              <span>Real axe-core engine</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-cyan-400 shrink-0" aria-hidden="true" />
              <span>SSRF DNS pre-check</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-cyan-400 shrink-0" aria-hidden="true" />
              <span>Zero fabricated scores</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-navy-800/80 text-[11px] text-slate-500">
        <p>AccessGuard AI v1.0.0</p>
        <p>Accessible by Default</p>
      </div>
    </aside>
  );
}
