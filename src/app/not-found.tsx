import Link from "next/link";
import { Home, Search } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div
        className="text-9xl font-black mb-4 select-none"
        style={{
          fontFamily: "var(--font-display)",
          background: "linear-gradient(135deg, #7C3AED, #EC4899)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </div>
      <h1 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>
        Sahifa topilmadi
      </h1>
      <p className="text-base mb-8 max-w-sm" style={{ color: "var(--text-muted)" }}>
        Siz izlayotgan sahifa mavjud emas yoki o&apos;chirilgan
      </p>
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button size="lg">
            <Home className="h-5 w-5" />
            Bosh sahifa
          </Button>
        </Link>
        <Link href="/qidirish">
          <Button variant="secondary" size="lg">
            <Search className="h-5 w-5" />
            Qidirish
          </Button>
        </Link>
      </div>
    </div>
  );
}
