import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface GameCardProps {
  icon: string;
  title: string;
  description: string;
  to?: string;
  href?: string;
  comingSoon?: boolean;
  delay?: number;
  animation?: ReactNode;
  className?: string;
  progress?: number;
  streak?: number;
  ctaLabel?: string;
  difficulty?: string;
  badge?: string;
  subtitle?: string;
  actionButtons?: ReactNode;
}

const GameCard = ({
  icon,
  title,
  description,
  to,
  href,
  comingSoon,
  delay = 0,
  animation,
  className,
  progress,
  streak,
  ctaLabel,
  difficulty,
  badge,
  subtitle,
  actionButtons,
}: GameCardProps) => {
  const featured = progress !== undefined || streak !== undefined || ctaLabel || difficulty || badge || subtitle;
  const ringProgress = Math.max(0, Math.min(100, progress ?? 0));
  const ringSize = 92;
  const ringStroke = 8;
  const ringRadius = ringSize / 2 - ringStroke;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - ringProgress / 100);
  const actionRow = actionButtons ? <div className="relative z-20 mt-4 flex flex-wrap gap-2 pointer-events-auto">{actionButtons}</div> : null;

  const content = (
    <div
      className={`
        glass-panel relative overflow-hidden p-6 sm:p-8
        transition-all duration-500 ease-out h-full
        ${featured ? "sm:p-7 lg:p-8" : ""}
        ${comingSoon ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:-translate-y-2 hover:shadow-[0_0_30px_hsl(270_80%_60%/0.3),0_0_60px_hsl(185_80%_50%/0.15)]"}
        group
        ${className ?? ""}
      `}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Animated gradient border overlay */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none gradient-border" />

      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-neon-purple/0 via-neon-cyan/0 to-neon-pink/0 group-hover:from-neon-purple/10 group-hover:via-neon-cyan/10 group-hover:to-neon-pink/10 rounded-xl transition-all duration-500 blur-xl pointer-events-none" />

      <div className={`relative z-10 pointer-events-none ${featured ? "flex h-full flex-col gap-5" : ""}`}>
        {featured ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {badge && (
                    <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-display font-bold tracking-[0.18em] uppercase bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20">
                      {badge}
                    </span>
                  )}
                  {difficulty && (
                    <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-display font-bold tracking-[0.18em] uppercase bg-white/10 text-foreground border border-white/10">
                      {difficulty}
                    </span>
                  )}
                </div>
                {animation ? <div className="mb-3 max-w-[180px]">{animation}</div> : <span className="text-4xl sm:text-5xl block mb-4">{icon}</span>}
                <h3 className="font-display text-xl sm:text-2xl font-black text-foreground mb-2 group-hover:text-glow-purple transition-all duration-300">
                  {title}
                </h3>
                <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md">
                  {subtitle ?? description}
                </p>
              </div>

              <div className="shrink-0 relative w-[92px] h-[92px] sm:w-[110px] sm:h-[110px]">
                <svg viewBox={`0 0 ${ringSize} ${ringSize}`} className="w-full h-full -rotate-90">
                  <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} stroke="rgba(255,255,255,0.1)" strokeWidth={ringStroke} fill="none" />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    stroke="url(#cloud-card-ring)"
                    strokeWidth={ringStroke}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                  />
                  <defs>
                    <linearGradient id="cloud-card-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4dd0ff" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-display text-lg sm:text-xl font-black text-foreground">{ringProgress}%</span>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Progress</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">Daily Streak</p>
                <div className="flex items-end gap-2">
                  <span className="font-display text-2xl sm:text-3xl font-black text-foreground">{streak ?? 0}</span>
                  <span className="text-xs text-muted-foreground pb-1">days</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">Module</p>
                <p className="font-display text-base sm:text-lg font-bold text-foreground leading-tight">Cloud Learning</p>
              </div>
            </div>

            <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed">{description}</p>

            {comingSoon && (
              <span className="inline-block mt-1 px-3 py-1 text-xs font-display font-bold tracking-wider uppercase bg-neon-purple/20 text-neon-purple border border-neon-purple/30 rounded-full animate-pulse w-fit">
                Coming Soon
              </span>
            )}

            {!comingSoon && (
              <div className="mt-auto flex items-center justify-between gap-3 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-neon-cyan/80">Continue Learning</p>
                  <p className="font-display text-sm sm:text-base font-bold text-foreground">Enter the cloud hub</p>
                </div>
                <div className="h-10 min-w-10 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan font-display font-black">
                  {ctaLabel ?? "GO"}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {animation ? (
              <div className="mb-3">{animation}</div>
            ) : (
              <span className="text-4xl sm:text-5xl block mb-4">{icon}</span>
            )}
            <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-glow-purple transition-all duration-300">
              {title}
            </h3>
            <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed">
              {description}
            </p>

            {comingSoon && (
              <span className="inline-block mt-4 px-3 py-1 text-xs font-display font-bold tracking-wider uppercase bg-neon-purple/20 text-neon-purple border border-neon-purple/30 rounded-full animate-pulse">
                Coming Soon
              </span>
            )}

            {!comingSoon && !actionButtons && !href && (
              <div className="mt-4 flex items-center gap-2 text-neon-cyan font-display text-sm font-semibold tracking-wide">
                <span>ENTER</span>
                <span className="text-lg">→</span>
              </div>
            )}
          </>
        )}
        {actionRow}
      </div>
    </div>
  );

  if (comingSoon || (!to && !href)) return <div className="animate-fade-in" style={{ animationDelay: `${delay}ms` }}>{content}</div>;

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="relative block">
        {href ? (
          <a
            href={href}
            aria-label={`Open ${title}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-0 rounded-xl"
          />
        ) : (
          <Link
            to={to!}
            aria-label={`Open ${title}`}
            className="absolute inset-0 z-0 rounded-xl"
          />
        )}
        <div className="relative z-10 pointer-events-none">
          {content}
        </div>
      </div>
    </div>
  );
};

export default GameCard;
