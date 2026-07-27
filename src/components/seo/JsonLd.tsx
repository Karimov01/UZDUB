// Server component — schema.org structured data (Google & Yandex "rich results")
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Structured data JSON — XSS xavfi yo'q, chunki bu bizning nazoratimizdagi ma'lumot
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
