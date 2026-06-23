import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Fuentes RSS configuradas para importar noticias
 */
export const rssSources = mysqlTable("rss_sources", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  category: varchar("category", { length: 100 }).notNull().default("General"),
  active: boolean("active").notNull().default(true),
  lastFetched: timestamp("lastFetched"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RssSource = typeof rssSources.$inferSelect;
export type InsertRssSource = typeof rssSources.$inferInsert;

/**
 * Artículos importados desde fuentes RSS
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  imageUrl: text("imageUrl"),
  sourceUrl: text("sourceUrl").notNull(),
  sourceName: varchar("sourceName", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull().default("General"),
  publishedAt: timestamp("publishedAt").notNull(),
  hidden: boolean("hidden").notNull().default(false),
  status: mysqlEnum("status", ["pending", "published", "rejected"]).notNull().default("published"),
  tags: text("tags"), // JSON array de strings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Directorio Comercial — Listados de negocios
 */
export const directoryListings = mysqlTable("directory_listings", {
  id: int("id").autoincrement().primaryKey(),
  // Información principal
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  category: mysqlEnum("category", [
    "restaurantes", "hoteles", "tours", "inmobiliarias",
    "abogados", "medicos", "escuelas", "talleres"
  ]).notNull(),
  description: text("description"),
  shortDescription: varchar("shortDescription", { length: 300 }),
  // Contacto
  phone: varchar("phone", { length: 30 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
  email: varchar("email", { length: 320 }),
  website: text("website"),
  // Ubicación
  address: text("address"),
  neighborhood: varchar("neighborhood", { length: 150 }),
  city: varchar("city", { length: 100 }).notNull().default("Cancún"),
  state: varchar("state", { length: 100 }).notNull().default("Quintana Roo"),
  lat: varchar("lat", { length: 30 }),
  lng: varchar("lng", { length: 30 }),
  // Media
  logoUrl: text("logoUrl"),
  coverUrl: text("coverUrl"),
  photos: text("photos"), // JSON array de URLs
  // Suscripción
  plan: mysqlEnum("plan", ["basico", "profesional", "premium"]).notNull().default("basico"),
  planExpiresAt: timestamp("planExpiresAt"),
  featured: boolean("featured").notNull().default(false),
  // Estado
  status: mysqlEnum("status", ["pending", "active", "suspended"]).notNull().default("pending"),
  verified: boolean("verified").notNull().default(false),
  // Redes sociales
  facebook: text("facebook"),
  instagram: text("instagram"),
  // Métricas
  viewCount: int("viewCount").notNull().default(0),
  contactCount: int("contactCount").notNull().default(0),
  // Horarios (JSON: { lunes: "9:00-18:00", ... })
  schedule: text("schedule"),
  // Propietario (opcional, FK a users)
  ownerId: int("ownerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DirectoryListing = typeof directoryListings.$inferSelect;
export type InsertDirectoryListing = typeof directoryListings.$inferInsert;

/**
 * Directorio Comercial — Reseñas de negocios
 */
export const directoryReviews = mysqlTable("directory_reviews", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  // Autor (puede ser anónimo)
  authorName: varchar("authorName", { length: 150 }).notNull(),
  authorEmail: varchar("authorEmail", { length: 320 }),
  userId: int("userId"), // null si es anónimo
  // Contenido
  rating: int("rating").notNull(), // 1–5
  title: varchar("title", { length: 200 }),
  body: text("body"),
  // Moderación
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DirectoryReview = typeof directoryReviews.$inferSelect;
export type InsertDirectoryReview = typeof directoryReviews.$inferInsert;

/**
 * Directorio Comercial — Mensajes de contacto a negocios
 */
export const directoryContacts = mysqlTable("directory_contacts", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  senderName: varchar("senderName", { length: 150 }).notNull(),
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  senderPhone: varchar("senderPhone", { length: 30 }),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DirectoryContact = typeof directoryContacts.$inferSelect;
export type InsertDirectoryContact = typeof directoryContacts.$inferInsert;

/**
 * Directorio Comercial — Historial de suscripciones
 */
export const directorySubscriptions = mysqlTable("directory_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  plan: mysqlEnum("plan", ["basico", "profesional", "premium"]).notNull(),
  priceMonthly: int("priceMonthly").notNull(), // pesos MXN
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).notNull().default("active"),
  paymentMethod: varchar("paymentMethod", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DirectorySubscription = typeof directorySubscriptions.$inferSelect;
export type InsertDirectorySubscription = typeof directorySubscriptions.$inferInsert;
