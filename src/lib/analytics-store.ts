import { neon } from "@neondatabase/serverless";

type AnalyticsEvent = {
  id: string;
  visitorId: string;
  userId?: string;
  path: string;
  referrer?: string;
  source: string;
  device: string;
  browser: string;
};

type TrendPoint = { day: string; views: number; visitors: number };

const sql = () => neon(process.env.DATABASE_URL!);
let ready: Promise<void> | null = null;

async function ensureAnalyticsTables() {
  if (!ready) {
    const db = sql();
    ready = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id TEXT PRIMARY KEY,
          visitor_id TEXT NOT NULL,
          user_id TEXT,
          event_type TEXT NOT NULL,
          path TEXT NOT NULL,
          referrer TEXT,
          source TEXT NOT NULL DEFAULT 'Direct',
          device TEXT NOT NULL DEFAULT 'Desktop',
          browser TEXT NOT NULL DEFAULT 'Boshqa',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await db`CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON analytics_events(created_at DESC)`;
      await db`CREATE INDEX IF NOT EXISTS analytics_events_path_idx ON analytics_events(path, created_at DESC)`;
      await db`CREATE INDEX IF NOT EXISTS analytics_events_visitor_idx ON analytics_events(visitor_id, created_at DESC)`;
    })();
  }

  return ready;
}

export async function recordEvent(event: AnalyticsEvent) {
  await ensureAnalyticsTables();
  const db = sql();
  await db`
    INSERT INTO analytics_events (
      id, visitor_id, user_id, event_type, path, referrer, source, device, browser
    ) VALUES (
      ${event.id}, ${event.visitorId}, ${event.userId ?? null}, 'page_view',
      ${event.path}, ${event.referrer ?? null}, ${event.source}, ${event.device}, ${event.browser}
    )
  `;
}

function rangeStart(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function makeTrend(days: number, rows: { day: string; views: number; visitors: number }[]) {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const result: TrendPoint[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const day = date.toISOString().slice(0, 10);
    result.push(byDay.get(day) ?? { day, views: 0, visitors: 0 });
  }

  return result;
}

export async function getReport(days: number) {
  await ensureAnalyticsTables();
  const db = sql();
  const since = rangeStart(days);
  const [kpi, paths, sources, devices, browsers, trendRows] = await Promise.all([
    db`
      SELECT
        COUNT(*)::int AS views,
        COUNT(DISTINCT visitor_id)::int AS unique,
        COUNT(DISTINCT user_id)::int AS registered,
        COUNT(DISTINCT visitor_id) FILTER (WHERE user_id IS NULL)::int AS guests,
        COUNT(DISTINCT visitor_id) FILTER (WHERE created_at > now() - interval '5 minutes')::int AS online
      FROM analytics_events
      WHERE created_at >= ${since}
    ` as unknown as Promise<{ views: number; unique: number; registered: number; guests: number; online: number }[]>,
    db`SELECT path, COUNT(*)::int AS views FROM analytics_events WHERE created_at >= ${since} GROUP BY path ORDER BY views DESC LIMIT 8` as unknown as Promise<{ path: string; views: number }[]>,
    db`SELECT source, COUNT(*)::int AS views FROM analytics_events WHERE created_at >= ${since} GROUP BY source ORDER BY views DESC LIMIT 6` as unknown as Promise<{ source: string; views: number }[]>,
    db`SELECT device, COUNT(*)::int AS views FROM analytics_events WHERE created_at >= ${since} GROUP BY device ORDER BY views DESC LIMIT 4` as unknown as Promise<{ device: string; views: number }[]>,
    db`SELECT browser, COUNT(*)::int AS views FROM analytics_events WHERE created_at >= ${since} GROUP BY browser ORDER BY views DESC LIMIT 5` as unknown as Promise<{ browser: string; views: number }[]>,
    db`
      SELECT to_char(created_at AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS views,
        COUNT(DISTINCT visitor_id)::int AS visitors
      FROM analytics_events
      WHERE created_at >= ${since}
      GROUP BY day
      ORDER BY day
    ` as unknown as Promise<{ day: string; views: number; visitors: number }[]>,
  ]);

  return {
    kpi: kpi[0] ?? { views: 0, unique: 0, registered: 0, guests: 0, online: 0 },
    paths,
    sources,
    devices,
    browsers,
    trend: makeTrend(days, trendRows),
  };
}

