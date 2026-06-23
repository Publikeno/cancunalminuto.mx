import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  directoryContacts,
  directoryListings,
  directoryReviews,
  directorySubscriptions,
  type DirectoryListing,
  type InsertDirectoryContact,
  type InsertDirectoryListing,
  type InsertDirectoryReview,
  type InsertDirectorySubscription,
} from "../drizzle/schema";

// ── Listados ─────────────────────────────────────────────────

export async function getListings(opts: {
  category?: string;
  search?: string;
  plan?: string;
  featured?: boolean;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const {
    category,
    search,
    plan,
    featured,
    status = "active",
    limit = 20,
    offset = 0,
  } = opts;

  const conditions: any[] = [];
  if (status) conditions.push(eq(directoryListings.status, status as any));
  if (category) conditions.push(eq(directoryListings.category, category as any));
  if (plan) conditions.push(eq(directoryListings.plan, plan as any));
  if (featured !== undefined) conditions.push(eq(directoryListings.featured, featured));
  if (search) {
    conditions.push(
      or(
        like(directoryListings.name, `%${search}%`),
        like(directoryListings.shortDescription, `%${search}%`),
        like(directoryListings.neighborhood, `%${search}%`)
      )
    );
  }

  return db
    .select()
    .from(directoryListings)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      desc(directoryListings.featured),
      desc(directoryListings.plan),
      desc(directoryListings.createdAt)
    )
    .limit(limit)
    .offset(offset);
}

export async function getListingById(id: number): Promise<DirectoryListing | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(directoryListings)
    .where(eq(directoryListings.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getListingBySlug(slug: string): Promise<DirectoryListing | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(directoryListings)
    .where(eq(directoryListings.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function createListing(data: InsertDirectoryListing): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(directoryListings).values(data);
  return (result as any).insertId as number;
}

export async function updateListing(id: number, data: Partial<InsertDirectoryListing>) {
  const db = await getDb();
  if (!db) return;
  await db.update(directoryListings).set(data).where(eq(directoryListings.id, id));
}

export async function incrementListingView(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(directoryListings)
    .set({ viewCount: sql`${directoryListings.viewCount} + 1` })
    .where(eq(directoryListings.id, id));
}

export async function incrementListingContact(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(directoryListings)
    .set({ contactCount: sql`${directoryListings.contactCount} + 1` })
    .where(eq(directoryListings.id, id));
}

export async function countListings(opts: { status?: string; category?: string }) {
  const db = await getDb();
  if (!db) return 0;
  const conditions: any[] = [];
  if (opts.status) conditions.push(eq(directoryListings.status, opts.status as any));
  if (opts.category) conditions.push(eq(directoryListings.category, opts.category as any));

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(directoryListings)
    .where(conditions.length ? and(...conditions) : undefined);
  return result[0]?.count ?? 0;
}

// ── Reseñas ──────────────────────────────────────────────────

export async function getReviewsByListing(listingId: number, approvedOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(directoryReviews.listingId, listingId)];
  if (approvedOnly) conditions.push(eq(directoryReviews.status, "approved"));

  return db
    .select()
    .from(directoryReviews)
    .where(and(...conditions))
    .orderBy(desc(directoryReviews.createdAt));
}

export async function getAverageRating(listingId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ avg: sql<number>`avg(${directoryReviews.rating})` })
    .from(directoryReviews)
    .where(
      and(
        eq(directoryReviews.listingId, listingId),
        eq(directoryReviews.status, "approved")
      )
    );
  return Math.round((result[0]?.avg ?? 0) * 10) / 10;
}

export async function createReview(data: InsertDirectoryReview): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(directoryReviews).values(data);
  return (result as any).insertId as number;
}

export async function updateReviewStatus(id: number, status: "approved" | "rejected") {
  const db = await getDb();
  if (!db) return;
  await db.update(directoryReviews).set({ status }).where(eq(directoryReviews.id, id));
}

export async function getPendingReviews() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(directoryReviews)
    .where(eq(directoryReviews.status, "pending"))
    .orderBy(desc(directoryReviews.createdAt));
}

// ── Contactos ────────────────────────────────────────────────

export async function createContact(data: InsertDirectoryContact): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(directoryContacts).values(data);
  await incrementListingContact(data.listingId);
  return (result as any).insertId as number;
}

export async function getContactsByListing(listingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(directoryContacts)
    .where(eq(directoryContacts.listingId, listingId))
    .orderBy(desc(directoryContacts.createdAt));
}

// ── Suscripciones ────────────────────────────────────────────

export async function createSubscription(data: InsertDirectorySubscription): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(directorySubscriptions).values(data);
  await db
    .update(directoryListings)
    .set({ plan: data.plan, planExpiresAt: data.endDate, status: "active" })
    .where(eq(directoryListings.id, data.listingId));
  return (result as any).insertId as number;
}

export async function getActiveSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(directorySubscriptions)
    .where(eq(directorySubscriptions.status, "active"))
    .orderBy(desc(directorySubscriptions.startDate));
}

export async function getSubscriptionByListing(listingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(directorySubscriptions)
    .where(
      and(
        eq(directorySubscriptions.listingId, listingId),
        eq(directorySubscriptions.status, "active")
      )
    )
    .limit(1);
}

// ── Helpers de slug ──────────────────────────────────────────

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 280);
}
