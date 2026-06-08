/**
 * WordPress REST API Service
 * Consume datos de cancunalminuto.mx/wp-json
 */

const WP_BASE_URL = "https://cancunalminuto.mx/wp-json/wp/v2";

export interface WPPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  status: "publish" | "draft" | "pending" | "future";
  categories: number[];
  featured_media: number;
  author: number;
  comment_status: string;
  ping_status: string;
}

export interface WPCategory {
  id: number;
  name: string;
  count: number;
  description: string;
}

export interface DashboardStats {
  totalProcessed: number;
  totalGenerated: number;
  totalPublished: number;
  totalSources: number;
  trendProcessed: string;
  trendGenerated: string;
  trendPublished: string;
  trendSources: string;
}

export interface DailyStats {
  date: string;
  procesados: number;
  generados: number;
  publicados: number;
}

/**
 * Obtener todos los posts
 */
export async function fetchAllPosts(): Promise<WPPost[]> {
  try {
    const response = await fetch(`${WP_BASE_URL}/posts?per_page=100&orderby=date&order=desc`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

/**
 * Obtener posts por categoría
 */
export async function fetchPostsByCategory(categoryId: number): Promise<WPPost[]> {
  try {
    const response = await fetch(`${WP_BASE_URL}/posts?categories=${categoryId}&per_page=100`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching posts for category ${categoryId}:`, error);
    return [];
  }
}

/**
 * Obtener todas las categorías
 */
export async function fetchCategories(): Promise<WPCategory[]> {
  try {
    const response = await fetch(`${WP_BASE_URL}/categories?per_page=50&hide_empty=false`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Obtener posts en un rango de fechas
 */
export async function fetchPostsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<WPPost[]> {
  try {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    const response = await fetch(
      `${WP_BASE_URL}/posts?after=${start}&before=${end}&per_page=100&orderby=date&order=desc`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching posts by date range:", error);
    return [];
  }
}

/**
 * Calcular estadísticas del dashboard
 */
export async function calculateDashboardStats(): Promise<DashboardStats> {
  try {
    const [allPosts, categories] = await Promise.all([
      fetchAllPosts(),
      fetchCategories(),
    ]);

    // Contar posts por status
    const published = allPosts.filter((p) => p.status === "publish").length;
    const draft = allPosts.filter((p) => p.status === "draft").length;
    const total = allPosts.length;

    // Simular: Procesados = total, Generados = draft, Publicados = published
    const totalProcessed = total;
    const totalGenerated = draft;
    const totalPublished = published;
    const totalSources = categories.filter((c) => c.count > 0).length;

    // Calcular tendencias (simuladas basadas en datos actuales)
    const trend = Math.floor(Math.random() * 20) - 10;
    const trendProcessed = trend > 0 ? `+${trend}%` : `${trend}%`;
    const trendGenerated = trend > 0 ? `+${Math.floor(trend * 0.8)}%` : `${Math.floor(trend * 0.8)}%`;
    const trendPublished = trend > 0 ? `+${Math.floor(trend * 0.9)}%` : `${Math.floor(trend * 0.9)}%`;
    const trendSources = totalSources > 0 ? `+${Math.floor(totalSources * 0.1)}` : "0";

    return {
      totalProcessed,
      totalGenerated,
      totalPublished,
      totalSources,
      trendProcessed,
      trendGenerated,
      trendPublished,
      trendSources,
    };
  } catch (error) {
    console.error("Error calculating stats:", error);
    return {
      totalProcessed: 0,
      totalGenerated: 0,
      totalPublished: 0,
      totalSources: 0,
      trendProcessed: "0%",
      trendGenerated: "0%",
      trendPublished: "0%",
      trendSources: "0",
    };
  }
}

/**
 * Obtener estadísticas diarias de los últimos 7 días
 */
export async function getDailyStats(): Promise<DailyStats[]> {
  try {
    const posts = await fetchAllPosts();
    const days: { [key: string]: { procesados: number; generados: number; publicados: number } } =
      {};

    // Inicializar últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      days[dateStr] = { procesados: 0, generados: 0, publicados: 0 };
    }

    // Agrupar posts por fecha
    posts.forEach((post) => {
      const postDate = post.date.split("T")[0];
      if (days[postDate]) {
        days[postDate].procesados += 1;
        if (post.status === "draft") {
          days[postDate].generados += 1;
        }
        if (post.status === "publish") {
          days[postDate].publicados += 1;
        }
      }
    });

    // Convertir a array ordenado
    return Object.entries(days)
      .map(([date, stats]) => ({
        date: new Date(date).toLocaleDateString("es-MX", { weekday: "short" }),
        ...stats,
      }))
      .slice(-7);
  } catch (error) {
    console.error("Error getting daily stats:", error);
    return [];
  }
}

/**
 * Obtener posts recientes para el log
 */
export async function getRecentLogs(limit: number = 10) {
  try {
    const posts = await fetchAllPosts();
    return posts.slice(0, limit).map((post, index) => ({
      id: post.id,
      action: `Publicación: ${post.title.rendered.substring(0, 40)}...`,
      status: post.status === "publish" ? "Completado" : "En progreso",
      articles: 1,
      time: `Hace ${index * 2} horas`,
    }));
  } catch (error) {
    console.error("Error getting recent logs:", error);
    return [];
  }
}

/**
 * Obtener fuentes RSS (categorías)
 */
export async function getRSSSources() {
  try {
    const categories = await fetchCategories();
    return categories.map((cat) => ({
      name: cat.name,
      url: `${WP_BASE_URL}/posts?categories=${cat.id}`,
      articles: cat.count,
    }));
  } catch (error) {
    console.error("Error getting RSS sources:", error);
    return [];
  }
}
