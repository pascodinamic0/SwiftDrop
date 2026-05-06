import type { ReactNode } from "react";

export function LegalDocument({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="max-w-3xl mx-auto py-8 md:py-12 space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">Last updated: {updated}</p>
      </header>
      <div className="space-y-8 text-muted-foreground text-[15px] leading-relaxed [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:pt-2">
        {children}
      </div>
    </article>
  );
}
