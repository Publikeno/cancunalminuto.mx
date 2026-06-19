import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { articles, InsertArticle, InsertRssSource, rssSources } from "../drizzle/schema";
import { getDb } from "./db";

// ── Articles (public) ─────────────────────────────────────────────────────────

export async function getArticles(opts: {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const { limit = 20, offset = 0, category, search } = opts;

  // Solo artículos publicados y no ocultos
  const conditions = [eq(articles.hidden, false), eq(articles.status, "published")];
  if (category && category !== "Todos") {
    conditions.push(eq(articles.category, category));
  }
  if (search) {
    const searchCond = or(
      like(articles.title, `%${search}%`),
      like(articles.excerpt, `%${search}%`)
    );
    if (searchCond) conditions.push(searchCond);
  }

  const where = and(...conditions);

  const [items, countResult] = await Promise.all([
    db.select().from(articles).where(where).orderBy(desc(articles.publishedAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(articles).where(where),
  ]);

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function getLatestArticles(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(articles)
    .where(and(eq(articles.hidden, false), eq(articles.status, "published")))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result[0] ?? null;
}

export async function upsertArticle(article: InsertArticle) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.sourceUrl, article.sourceUrl))
    .limit(1);
  if (existing.length > 0) return;
  // Los nuevos artículos llegan como "pending" para moderación
  await db.insert(articles).values({ ...article, status: "pending" });
}

export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .selectDistinct({ category: articles.category })
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(articles.category);
  return result.map((r) => r.category);
}

// ── RSS Sources ───────────────────────────────────────────────────────────────

export async function getRssSources() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rssSources).orderBy(rssSources.name);
}

export async function getActiveRssSources() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rssSources).where(eq(rssSources.active, true));
}

export async function upsertRssSource(source: InsertRssSource) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(rssSources)
    .values(source)
    .onDuplicateKeyUpdate({ set: { name: source.name, category: source.category, active: source.active } });
}

export async function updateRssSourceLastFetched(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(rssSources).set({ lastFetched: new Date() }).where(eq(rssSources.id, id));
}

// ── Admin: RSS Sources ────────────────────────────────────────────────────────

export async function insertRssSource(source: InsertRssSource) {
  const db = await getDb();
  if (!db) return;
  await db.insert(rssSources).values(source);
}

export async function updateRssSource(
  id: number,
  data: Partial<Pick<InsertRssSource, 'name' | 'url' | 'category' | 'active'>>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(rssSources).set(data).where(eq(rssSources.id, id));
}

export async function deleteRssSource(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(rssSources).where(eq(rssSources.id, id));
}

// ── Admin: Articles ───────────────────────────────────────────────────────────

export async function setArticleHidden(id: number, hidden: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(articles).set({ hidden }).where(eq(articles.id, id));
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(articles).where(eq(articles.id, id));
}

export async function getAdminArticles(opts: {
  limit?: number;
  offset?: number;
  search?: string;
  status?: "pending" | "published" | "rejected" | "all";
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const { limit = 30, offset = 0, search, status = "all" } = opts;
  const conditions: ReturnType<typeof eq>[] = [];

  if (status !== "all") {
    conditions.push(eq(articles.status, status) as ReturnType<typeof eq>);
  }
  if (search) {
    const searchCond = or(like(articles.title, `%${search}%`), like(articles.sourceName, `%${search}%`));
    if (searchCond) conditions.push(searchCond as ReturnType<typeof eq>);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.select().from(articles).where(where).orderBy(desc(articles.publishedAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(articles).where(where),
  ]);

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

// Moderación: actualizar status, categoría y tags de un artículo
export async function moderateArticle(
  id: number,
  data: {
    status: "pending" | "published" | "rejected";
    category?: string;
    tags?: string[];
  }
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(articles)
    .set({
      status: data.status,
      ...(data.category ? { category: data.category } : {}),
      ...(data.tags !== undefined ? { tags: JSON.stringify(data.tags) } : {}),
    })
    .where(eq(articles.id, id));
}

// Contar artículos pendientes
export async function countPendingArticles() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(eq(articles.status, "pending"));
  return Number(result[0]?.count ?? 0);
}
