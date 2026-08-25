import SectionMoreButton from "@/components/home/SectionMoreButton";

export default function SectionHeader({ title, href, icon }: { title: string; href?: string; icon: React.ReactNode }) {
  return <div className="mx-auto mb-4 flex max-w-[1400px] items-center justify-between px-3 sm:px-4 md:px-8">
    <h2 className="flex items-center gap-2 text-lg font-bold text-white md:text-xl" style={{ fontFamily: "var(--font-display)" }}>{icon}{title}</h2>
    {href ? <SectionMoreButton href={href} /> : null}
  </div>;
}
