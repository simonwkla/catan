import type { PropsWithChildren } from "react";

interface SectionProps {
  title: string;
  description?: string;
}

export const Section = ({ title, description, children }: PropsWithChildren<SectionProps>) => (
  <section className="flex flex-col gap-3">
    <div>
      <h3 className="text-xl">{title}</h3>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
    </div>
    <div>{children}</div>
  </section>
);
