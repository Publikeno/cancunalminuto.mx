import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { getActiveRssSources } from "./db-news";
import { fetchAndImportRss } from "./rss-importer";

/**
 * Handler para la importación automática de RSS cada 30 minutos.
 * Se invoca desde el cron de Heartbeat en /api/scheduled/import-rss
 */
export async function importRssScheduledHandler(req: Request, res: Response) {
  try {
    // Autenticar que es un cron legítimo
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    const sources = await getActiveRssSources();
    if (!sources || sources.length === 0) {
      return res.json({ ok: true, imported: 0, message: "No active sources" });
    }

    const result = await fetchAndImportRss(sources);

    console.log(`[Scheduled RSS] Imported ${result.total} articles from ${result.sources.length} sources`);

    return res.json({
      ok: true,
      imported: result.total,
      sources: result.sources,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[Scheduled RSS] Error:", error);
    return res.status(500).json({
      error,
      stack,
      context: { url: req.url, taskUid: req.headers["x-task-uid"] },
      timestamp: new Date().toISOString(),
    });
  }
}
