import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clapperboard,
  Sparkles,
  Users,
  Video,
  Film,
  Layers,
  Ratio,
  CheckCircle2,
  ArrowRight,
  Play,
  Flame,
  VolumeX,
  Crown,
  BookOpen,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { FirebaseSetupBanner } from '../components/FirebaseSetupBanner';

export const LandingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const features = [
    {
      icon: Users,
      title: 'Realistic & 3D Characters',
      desc: 'Authentic African faces, expressive Nollywood actors, customizable attire (Ankara, suits, traditional geeles).',
    },
    {
      icon: Sparkles,
      title: 'African Story Ideas',
      desc: 'Curated Nollywood drama tropes: family feuds, mother-in-law disputes, village folktales, and rags-to-riches twists.',
    },
    {
      icon: Layers,
      title: 'Consistent Character Identity',
      desc: 'Lock in facial structures, hairstyles, and wardrobe across multiple scenes without character distortion.',
    },
    {
      icon: Film,
      title: 'Perfect Image & Video Prompts',
      desc: 'Ready-to-use prompts fine-tuned for Midjourney, FLUX, Runway Gen-3, Luma Dream Machine, and Kling.',
    },
    {
      icon: VolumeX,
      title: 'No Voiceover, Characters Talk',
      desc: 'Built specifically for dramatic dialogue-driven scenes with lip-sync prompt tags and real emotional delivery.',
    },
    {
      icon: Ratio,
      title: '9:16 and 16:9 Prompt Support',
      desc: 'Generate viral vertical formats for TikTok, YouTube Shorts, and Instagram Reels, or widescreen cinema format.',
    },
  ];

  const storyTypes = [
    {
      title: 'Modern Family Drama',
      tag: 'Marriage, betrayal, family conflict',
      badge: 'Popular',
      color: 'from-amber-500/20 to-purple-900/40',
      icon: '💍',
    },
    {
      title: 'Village Folktale',
      tag: 'Traditional stories with moral lessons',
      badge: 'Cultural',
      color: 'from-emerald-500/20 to-purple-900/40',
      icon: '🛖',
    },
    {
      title: 'Mystery / Supernatural',
      tag: 'Spiritual, cursed, magical stories',
      badge: 'Thrilling',
      color: 'from-indigo-500/20 to-purple-900/40',
      icon: '🔮',
    },
    {
      title: 'Mother-in-law Drama',
      tag: 'Family pressure and relationship issues',
      badge: 'Nollywood Classic',
      color: 'from-rose-500/20 to-purple-900/40',
      icon: '👑',
    },
    {
      title: 'Poor Girl / Rich Family',
      tag: 'Rags to riches, hidden truth',
      badge: 'Emotional',
      color: 'from-blue-500/20 to-purple-900/40',
      icon: '✨',
    },
    {
      title: "Children's Moral Story",
      tag: 'Simple and educational folklore',
      badge: 'Family Friendly',
      color: 'from-yellow-500/20 to-purple-900/40',
      icon: '📖',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Enter Story Idea',
      desc: 'Type a premise or choose from rich African drama categories (folktales, modern conflicts, spiritual secrets).',
    },
    {
      num: '02',
      title: 'Generate Drama Story',
      desc: 'Get full script outline with high-stakes cliffhangers, dialogue beats, and emotional cliffhangers.',
    },
    {
      num: '03',
      title: 'Create Characters',
      desc: 'Build consistent characters like Amaka, Chinedu, and Mama with multi-angle reference descriptions.',
    },
    {
      num: '04',
      title: 'Generate Scene Prompts',
      desc: 'Receive copy-ready AI image and video prompts with precise camera movement, lighting, and wardrobe.',
    },
    {
      num: '05',
      title: 'Export Production Pack',
      desc: 'Download everything in one formatted package: script, dialogues, prompts, hashtags, and titles.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090711] text-slate-100 selection:bg-purple-600 selection:text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="ambient-glow-purple -top-40 -left-40" />
      <div className="ambient-glow-gold top-1/4 -right-40" />
      <div className="ambient-glow-purple bottom-10 left-1/3" />

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#090711]/85 border-b border-purple-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-purple-600 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0d0a1a] rounded-[10px] flex items-center justify-center">
                <Clapperboard className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                AI DRAMA <span className="gold-gradient-text">CREATOR</span>
              </span>
              <p className="text-[10px] text-purple-300/70 tracking-widest uppercase font-semibold hidden sm:block">
                African Cinematic Studio
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-purple-200 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="gold-gradient-btn px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 relative z-10">
        {/* Firebase Notice banner if backend is pending keys */}
        <FirebaseSetupBanner />

        {/* HERO SECTION */}
        <section className="pt-4 pb-16 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column (Hero Content) */}
            <div className="lg:col-span-7 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-6 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Nollywood & African AI Storytelling Engine</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] mb-6">
                Create African AI Drama Videos With{' '}
                <span className="gold-gradient-text">Characters That Talk</span>
              </h1>

              <p className="text-base sm:text-xl text-slate-300/90 leading-relaxed mb-8 max-w-2xl font-normal">
                Generate story ideas, characters, scenes, image prompts, and video prompts for cinematic AI drama videos.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
                <Link
                  to="/signup"
                  className="gold-gradient-btn px-7 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2.5 text-center"
                >
                  <Flame className="w-5 h-5 text-amber-950 fill-amber-950" />
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 text-amber-950" />
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-4 rounded-xl text-base font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 transition-all flex items-center justify-center gap-2 text-center"
                >
                  <span>Login to Studio</span>
                </Link>
              </div>

              {/* Quick Feature Badges (2x2 grid on mobile, inline/wrap on tablet/desktop) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-4 border-t border-purple-900/30 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-800/30 p-2.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium">Realistic & 3D Characters</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-800/30 p-2.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium">African Story Ideas</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-800/30 p-2.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium">Consistent Identity</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-800/30 p-2.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium">No Voiceover, Real Talk</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Showcase Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden drama-card border-2 border-purple-500/30 shadow-2xl shadow-purple-950/80 p-3 sm:p-4 bg-gradient-to-b from-[#19142e] to-[#0d0a17]">
                {/* Visual drama preview banner */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-purple-900 via-stone-900 to-amber-950 flex flex-col justify-end p-5 border border-purple-500/20">
                  {/* Decorative backdrop elements representing African cinematic visual */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                  <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Nollywood Drama</span>
                  </div>

                  {/* Character representation mockup */}
                  <div className="relative z-20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full border-2 border-amber-400 overflow-hidden bg-purple-800 flex items-center justify-center font-bold text-amber-300 shadow-md">
                        <span className="text-sm">AM</span>
                      </div>
                      <div className="w-12 h-12 rounded-full border-2 border-purple-400 overflow-hidden bg-stone-800 flex items-center justify-center font-bold text-purple-200 shadow-md -ml-5">
                        <span className="text-sm">CH</span>
                      </div>
                      <div className="w-12 h-12 rounded-full border-2 border-amber-300 overflow-hidden bg-amber-900 flex items-center justify-center font-bold text-yellow-100 shadow-md -ml-5">
                        <span className="text-sm">MA</span>
                      </div>
                      <div className="ml-2">
                        <p className="text-xs font-bold text-white">Amaka, Chinedu & Mama</p>
                        <p className="text-[11px] text-purple-300">Consistent multi-character dialogue</p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-amber-200/90 italic mb-3">
                      &ldquo;After everything I did to train you through school, is this how you repay me?&rdquo;
                    </p>

                    <div className="flex items-center justify-between text-xs bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg border border-purple-500/30">
                      <span className="text-slate-300 font-mono text-[11px]">Prompt: 9:16 Vertical • Lip-sync</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-card info */}
                <div className="mt-3 p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-300 font-medium">African Dialect & Ankara Styler Active</span>
                  </div>
                  <span className="text-amber-400 font-bold">100% Consistent</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* POPULAR STORY TYPES SECTION */}
        <section className="py-12 border-t border-purple-900/30">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Popular African Drama Story Types
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Pick from classic Nollywood formats or create your own custom African drama universe.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {storyTypes.map((story, idx) => (
              <div
                key={idx}
                className="drama-card drama-card-hover p-5 rounded-2xl flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl p-2 rounded-xl bg-purple-900/50 border border-purple-500/20">
                      {story.icon}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-500/20">
                      {story.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed">
                    {story.tag}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs text-purple-300 font-semibold group-hover:text-amber-300">
                  <span>Explore story archetypes</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section className="py-16 border-t border-purple-900/30">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">
              Engineered for Realistic African Drama
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Everything you need to turn raw story concepts into fully produced viral AI video packs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <div
                  key={index}
                  className="drama-card p-6 rounded-2xl border border-purple-900/40 hover:border-purple-500/40 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center mb-5 text-amber-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-300/80 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-16 border-t border-purple-900/30">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">
              How It Works
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              5 seamless steps from raw idea to complete multi-scene production pack.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="drama-card p-5 rounded-2xl flex flex-col justify-between relative"
              >
                <div>
                  <span className="text-2xl font-black text-amber-400/40 mb-3 block font-mono">
                    {step.num}
                  </span>
                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-300/80 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING SECTION */}
        <section className="py-16 border-t border-purple-900/30">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">
              Transparent Production Plans
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mb-6">
              Start free, then unlock commercial rights and character reference preservation.
            </p>

            {/* Monthly / Yearly Switch */}
            <div className="inline-flex items-center p-1.5 rounded-xl bg-purple-950/60 border border-purple-800/40">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <span>Yearly</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-amber-200">
                  Save 50%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className="drama-card p-6 sm:p-8 rounded-2xl flex flex-col justify-between border border-purple-900/50">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Free Plan</h3>
                <p className="text-xs text-slate-400 mb-4">For testing out story concepts</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-white">$0</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>5 story ideas per day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>1 drama project</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Basic scene prompts</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/signup"
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-center font-bold text-sm transition-colors block"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="drama-card p-6 sm:p-8 rounded-2xl flex flex-col justify-between border-2 border-amber-500/60 shadow-xl shadow-amber-500/10 relative bg-gradient-to-b from-[#1b1432] to-[#120d22]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-400 text-stone-950 font-extrabold text-[11px] uppercase tracking-wider shadow-md">
                Most Popular
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-1">Pro Plan</h3>
                <p className="text-xs text-amber-200/70 mb-4">For active creators & producers</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    {billingCycle === 'monthly' ? '$9.99' : '$4.99'}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-200 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Unlimited story ideas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>50 projects per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>All styles (Realistic, 3D, Cartoon, Drawn)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Advanced image & video prompts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Priority generation support</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/signup"
                className="w-full gold-gradient-btn py-3.5 rounded-xl text-center font-bold text-sm block"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Ultra Plan */}
            <div className="drama-card p-6 sm:p-8 rounded-2xl flex flex-col justify-between border border-purple-900/50">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Ultra Plan</h3>
                <p className="text-xs text-slate-400 mb-4">For studios & monetization</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    {billingCycle === 'monthly' ? '$19.99' : '$9.99'}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Unlimited projects</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Character reference uploads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Commercial use license</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Full export pack with SRT captions</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/signup"
                className="w-full purple-gradient-btn py-3 rounded-xl text-center font-bold text-sm block"
              >
                Upgrade to Ultra
              </Link>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-16 text-center">
          <div className="drama-card p-8 sm:p-12 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-purple-950/60 via-[#1b122e] to-amber-950/40">
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
              Ready to Create Your First Nollywood AI Drama?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-8">
              Join thousands of African filmmakers, TikTok creators, and storytellers producing realistic AI characters.
            </p>
            <Link
              to="/signup"
              className="gold-gradient-btn inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold shadow-xl shadow-amber-500/25"
            >
              <span>Create Account Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-purple-900/30 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-white">
            <Clapperboard className="w-4 h-4 text-amber-400" />
            <span>AI DRAMA CREATOR</span>
          </div>
          <p>© {new Date().getFullYear()} AI Drama Creator. Built for African & Nollywood Storytelling.</p>
          <div className="flex items-center gap-4 text-purple-300">
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <span>•</span>
            <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
