import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getActiveRssSources,
  getArticleById,
  getArticles,
  getCategories,
  getLatestArticles,
  getRssSources,
  upsertArticle,
  upsertRssSource,
} from "../db-news";
import { fetchAndImportRss } from "../rss-importer";

export const newsRouter = router({
  // Obtener artículos con paginación, filtro por categoría y búsqueda
  getArticles: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        category: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return getArticles(input);
    }),

  // Últimas noticias (para hero/destacados)
  getLatest: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ input }) => {
      return getLatestArticles(input.limit);
    }),

  // Obtener artículo por ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getArticleById(input.id);
    }),

  // Obtener categorías disponibles
  getCategories: publicProcedure.query(async () => {
    return getCategories();
  }),

  // Obtener fuentes RSS
  getSources: publicProcedure.query(async () => {
    return getRssSources();
  }),

  // Importar noticias desde RSS (puede llamarse manualmente o desde un job)
  importFromRss: publicProcedure.mutation(async () => {
    const sources = await getActiveRssSources();
    if (sources.length === 0) {
      // Inicializar fuentes por defecto si no hay ninguna
      await initDefaultSources();
      const newSources = await getActiveRssSources();
      const results = await fetchAndImportRss(newSources);
      return { imported: results.total, sources: results.sources };
    }
    const results = await fetchAndImportRss(sources);
    return { imported: results.total, sources: results.sources };
  }),
});

async function initDefaultSources() {
  const defaultSources = [
    // Cancún y Quintana Roo
    { name: "Noticaribe", url: "https://noticaribe.com.mx/feed/", category: "Cancún" },
    { name: "Diario de Yucatán", url: "https://www.yucatan.com.mx/feed", category: "Quintana Roo" },
    { name: "El Siglo de Torreón", url: "https://www.elsiglodetorreon.com.mx/index.xml", category: "Nacional" },
    // Nacional
    { name: "Vanguardia MX", url: "https://vanguardia.com.mx/rss.xml", category: "Nacional" },
    { name: "El Informador", url: "https://www.informador.mx/rss/mexico.xml", category: "Nacional" },
    { name: "Diario Basta", url: "https://diariobasta.com/feed/", category: "Nacional" },
    { name: "Latinus", url: "https://latinus.us/rss/", category: "Nacional" },
    { name: "Mexico News Daily", url: "https://mexiconewsdaily.com/feed/", category: "Nacional" },
  ];

  for (const source of defaultSources) {
    await upsertRssSource({ ...source, active: true });
  }
}
