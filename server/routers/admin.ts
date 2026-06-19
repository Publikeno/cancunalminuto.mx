import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  deleteArticle,
  deleteRssSource,
  getActiveRssSources,
  getAdminArticles,
  getRssSources,
  insertRssSource,
  setArticleHidden,
  updateRssSource,
} from "../db-news";
import { fetchAndImportRss } from "../rss-importer";

export const adminRouter = router({
  // ── Artículos ──────────────────────────────────────────────────────────────
  getArticles: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return getAdminArticles(input);
    }),

  hideArticle: adminProcedure
    .input(z.object({ id: z.number(), hidden: z.boolean() }))
    .mutation(async ({ input }) => {
      await setArticleHidden(input.id, input.hidden);
      return { success: true };
    }),

  deleteArticle: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteArticle(input.id);
      return { success: true };
    }),

  // ── Fuentes RSS ────────────────────────────────────────────────────────────
  getSources: adminProcedure.query(async () => {
    return getRssSources();
  }),

  addSource: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
        category: z.string().default("General"),
        active: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      await insertRssSource(input);
      return { success: true };
    }),

  updateSource: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        url: z.string().url().optional(),
        category: z.string().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateRssSource(id, data);
      return { success: true };
    }),

  deleteSource: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteRssSource(input.id);
      return { success: true };
    }),

  // ── Importación manual ─────────────────────────────────────────────────────
  importNow: adminProcedure.mutation(async () => {
    const sources = await getActiveRssSources();
    const results = await fetchAndImportRss(sources);
    return { imported: results.total, sources: results.sources };
  }),
});
