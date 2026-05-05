import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 group ${className}`}>
      <div className="relative h-8 w-8 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-0 group-hover:opacity-100 transition-opacity" />
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary relative z-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z" />
        </svg>
      </div>
      <span className="font-display font-bold text-xl tracking-tight">SwiftDrop</span>
    </Link>
  );
}
