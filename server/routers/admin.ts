import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  countPendingArticles,
  deleteArticle,
  deleteRssSource,
  getActiveRssSources,
  getAdminArticles,
  getRssSources,
  insertRssSource,
  moderateArticle,
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

  // ── Moderación ─────────────────────────────────────────────────────────────
  getPendingCount: adminProcedure.query(async () => {
    const count = await countPendingArticles();
    return { count };
  }),

  getArticlesByStatus: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "published", "rejected", "all"]).default("pending"),
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return getAdminArticles(input);
    }),

  moderateArticle: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "published", "rejected"]),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await moderateArticle(input.id, {
        status: input.status,
        category: input.category,
        tags: input.tags,
      });
      return { success: true };
    }),

  // Publicar o rechazar múltiples artículos a la vez
  bulkModerate: adminProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        status: z.enum(["published", "rejected"]),
      })
    )
    .mutation(async ({ input }) => {
      await Promise.all(
        input.ids.map((id) => moderateArticle(id, { status: input.status }))
      );
      return { success: true, count: input.ids.length };
    }),

  // ── Importación manual ─────────────────────────────────────────────────────
  importNow: adminProcedure.mutation(async () => {
    const sources = await getActiveRssSources();
    const results = await fetchAndImportRss(sources);
    return { imported: results.total, sources: results.sources };
  }),
});
