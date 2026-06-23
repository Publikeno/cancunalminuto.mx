import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  countListings,
  createContact,
  createListing,
  createReview,
  createSubscription,
  generateSlug,
  getActiveSubscriptions,
  getAverageRating,
  getContactsByListing,
  getListingById,
  getListingBySlug,
  getListings,
  getPendingReviews,
  getReviewsByListing,
  getSubscriptionByListing,
  updateListing,
  updateReviewStatus,
} from "../db-directory";

const CATEGORIES = [
  "restaurantes", "hoteles", "tours", "inmobiliarias",
  "abogados", "medicos", "escuelas", "talleres",
] as const;

const PLANS = ["basico", "profesional", "premium"] as const;

// Precios en MXN por mes
const PLAN_PRICES: Record<string, number> = {
  basico: 299,
  profesional: 699,
  premium: 1299,
};

export const directoryRouter = router({
  // ── Listados públicos ───────────────────────────────────────

  list: publicProcedure
    .input(
      z.object({
        category: z.enum(CATEGORIES).optional(),
        search: z.string().optional(),
        plan: z.enum(PLANS).optional(),
        featured: z.boolean().optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const items = await getListings({ ...input, status: "active" });
      const total = await countListings({ status: "active", category: input.category });
      return { items, total };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const listing = await getListingById(input.id);
      if (!listing || listing.status !== "active") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Negocio no encontrado" });
      }
      const reviews = await getReviewsByListing(input.id, true);
      const avgRating = await getAverageRating(input.id);
      const subscription = await getSubscriptionByListing(input.id);
      return { listing, reviews, avgRating, subscription: subscription[0] ?? null };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const listing = await getListingBySlug(input.slug);
      if (!listing || listing.status !== "active") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Negocio no encontrado" });
      }
      const reviews = await getReviewsByListing(listing.id, true);
      const avgRating = await getAverageRating(listing.id);
      return { listing, reviews, avgRating };
    }),

  trackView: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { incrementListingView } = await import("../db-directory");
      await incrementListingView(input.id);
      return { ok: true };
    }),

  // ── Reseñas ─────────────────────────────────────────────────

  submitReview: publicProcedure
    .input(
      z.object({
        listingId: z.number(),
        authorName: z.string().min(2).max(150),
        authorEmail: z.string().email().optional(),
        rating: z.number().min(1).max(5),
        title: z.string().max(200).optional(),
        body: z.string().min(10).max(2000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const listing = await getListingById(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createReview({
        listingId: input.listingId,
        authorName: input.authorName,
        authorEmail: input.authorEmail,
        rating: input.rating,
        title: input.title,
        body: input.body,
        status: "pending",
      });
      return { id, message: "Tu reseña fue enviada y será revisada en breve." };
    }),

  // ── Contacto ────────────────────────────────────────────────

  sendContact: publicProcedure
    .input(
      z.object({
        listingId: z.number(),
        senderName: z.string().min(2).max(150),
        senderEmail: z.string().email(),
        senderPhone: z.string().max(30).optional(),
        message: z.string().min(10).max(2000),
      })
    )
    .mutation(async ({ input }) => {
      const listing = await getListingById(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      const id = await createContact({
        listingId: input.listingId,
        senderName: input.senderName,
        senderEmail: input.senderEmail,
        senderPhone: input.senderPhone,
        message: input.message,
      });
      return { id, message: "Mensaje enviado. El negocio te contactará pronto." };
    }),

  // ── Alta de negocio (público) ────────────────────────────────

  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255),
        category: z.enum(CATEGORIES),
        shortDescription: z.string().max(300).optional(),
        description: z.string().max(5000).optional(),
        phone: z.string().max(30).optional(),
        whatsapp: z.string().max(30).optional(),
        email: z.string().email().optional(),
        website: z.string().url().optional(),
        address: z.string().max(500).optional(),
        neighborhood: z.string().max(150).optional(),
        city: z.string().max(100).default("Cancún"),
        lat: z.string().max(30).optional(),
        lng: z.string().max(30).optional(),
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        plan: z.enum(PLANS).default("basico"),
      })
    )
    .mutation(async ({ input }) => {
      const baseSlug = generateSlug(input.name);
      // Asegurar unicidad del slug
      const existing = await getListingBySlug(baseSlug);
      const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

      const id = await createListing({
        ...input,
        slug,
        status: "pending",
        verified: false,
        featured: false,
        viewCount: 0,
        contactCount: 0,
      });

      // Si el plan no es básico, registrar suscripción pendiente de pago
      // El listing queda en estado "pending" hasta que el admin confirme el pago y lo active
      if (input.plan !== "basico") {
        const months = 1;
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + months);
        await createSubscription({
          listingId: id,
          plan: input.plan,
          priceMonthly: PLAN_PRICES[input.plan],
          endDate,
          status: "active",
          paymentMethod: "pendiente",
          notes: "Pendiente de confirmación de pago",
        });
        // Revertir la activación automática que hace createSubscription
        await updateListing(id, { status: "pending" });
      }

      return {
        id,
        slug,
        message: "Tu negocio fue registrado y está en revisión. Te notificaremos cuando sea aprobado.",
      };
    }),

  // ── Planes y precios ─────────────────────────────────────────

  getPlans: publicProcedure.query(() => {
    return [
      {
        id: "basico",
        name: "Básico",
        price: 0,
        color: "gray",
        features: [
          "Perfil básico con nombre y categoría",
          "Teléfono y dirección",
          "1 foto de portada",
          "Formulario de contacto",
          "Reseñas de clientes",
        ],
        limitations: [
          "Sin posicionamiento destacado",
          "Sin logo personalizado",
          "Sin galería de fotos",
        ],
      },
      {
        id: "profesional",
        name: "Profesional",
        price: 699,
        color: "blue",
        badge: "Más popular",
        features: [
          "Todo lo del plan Básico",
          "Logo de empresa",
          "Galería de hasta 10 fotos",
          "Horarios de atención",
          "Redes sociales",
          "Posicionamiento mejorado",
          "Insignia verificado",
          "WhatsApp directo",
        ],
        limitations: [],
      },
      {
        id: "premium",
        name: "Premium",
        price: 1299,
        color: "gold",
        badge: "Máxima visibilidad",
        features: [
          "Todo lo del plan Profesional",
          "Posición destacada en la categoría",
          "Aparece en el mapa interactivo",
          "Banner en la portada del directorio",
          "Estadísticas de visitas y contactos",
          "Soporte prioritario",
          "Artículo de presentación en el portal",
        ],
        limitations: [],
      },
    ];
  }),

  // ── Admin: gestión de listados ───────────────────────────────

  adminList: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "active", "suspended"]).optional(),
        category: z.enum(CATEGORIES).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const items = await getListings({ ...input });
      const total = await countListings({ status: input.status, category: input.category });
      return { items, total };
    }),

  adminApprove: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["active", "suspended"]) }))
    .mutation(async ({ input }) => {
      await updateListing(input.id, { status: input.status });
      return { ok: true };
    }),

  adminUpdatePlan: adminProcedure
    .input(
      z.object({
        listingId: z.number(),
        plan: z.enum(PLANS),
        months: z.number().min(1).max(12).default(1),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + input.months);
      await createSubscription({
        listingId: input.listingId,
        plan: input.plan,
        priceMonthly: PLAN_PRICES[input.plan],
        endDate,
        status: "active",
        paymentMethod: "manual",
        notes: input.notes,
      });
      return { ok: true };
    }),

  adminGetSubscriptions: adminProcedure.query(async () => {
    return getActiveSubscriptions();
  }),

  adminGetPendingReviews: adminProcedure.query(async () => {
    return getPendingReviews();
  }),

  adminModerateReview: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["approved", "rejected"]),
      })
    )
    .mutation(async ({ input }) => {
      await updateReviewStatus(input.id, input.status);
      return { ok: true };
    }),

  adminGetContacts: adminProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ input }) => {
      return getContactsByListing(input.listingId);
    }),
});
