import DashboardLayout from "@/components/DashboardLayout";
import { ShareButtons } from "@/components/ShareButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Newspaper,
  Tag,
} from "lucide-react";
import { useLocation, useParams } from "wouter";

const categoryColors: Record<string, string> = {
  "Cancún": "bg-blue-100 text-blue-700 border-blue-200",
  "Quintana Roo": "bg-teal-100 text-teal-700 border-teal-200",
  "Nacional": "bg-purple-100 text-purple-700 border-purple-200",
  "Deportes": "bg-orange-100 text-orange-700 border-orange-200",
  "General": "bg-slate-100 text-slate-700 border-slate-200",
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function ArticleDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-4 w-40" />
      <div className="space-y-3 pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

export default function ArticleDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const articleId = parseInt(params.id ?? "0", 10);

  const { data: article, isLoading, error } = trpc.news.getById.useQuery(
    { id: articleId },
    { enabled: !isNaN(articleId) && articleId > 0 }
  );

  const catColor =
    categoryColors[article?.category ?? ""] || categoryColors["General"];

  // Parsear tags (JSON array guardado como string)
  let tags: string[] = [];
  try {
    if (article?.tags) tags = JSON.parse(article.tags);
  } catch {}

  const articleUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/noticia/${articleId}`
      : `/noticia/${articleId}`;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Barra superior de navegación */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="gap-2 text-slate-600 hover:text-slate-900 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/manus-storage/cancunalminuto-logo-transparent_341ac187.png"
              alt="Cancún al Minuto"
              className="h-8 w-auto object-contain shrink-0"
            />
            <span className="text-sm text-slate-500 truncate hidden sm:block">
              {isLoading ? "Cargando..." : article?.title ?? "Noticia"}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-3xl mx-auto px-4 py-8">
          {isLoading && <ArticleDetailSkeleton />}

          {error && (
            <div className="text-center py-20">
              <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-700 mb-2">
                No se pudo cargar la noticia
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Es posible que el artículo haya sido eliminado o no esté disponible.
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Ir al inicio
              </Button>
            </div>
          )}

          {!isLoading && !error && !article && (
            <div className="text-center py-20">
              <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-700 mb-2">
                Artículo no encontrado
              </h2>
              <Button
                onClick={() => setLocation("/")}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Ir al inicio
              </Button>
            </div>
          )}

          {!isLoading && article && (
            <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

              {/* Imagen principal ampliada */}
              {article.imageUrl && (
                <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).parentElement!.style.display = "none";
                    }}
                  />
                  {/* Gradiente sutil en la parte inferior */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              )}

              {/* Cuerpo del artículo */}
              <div className="p-6 sm:p-8">

                {/* Categoría + fuente */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Badge className={`text-xs border ${catColor}`} variant="outline">
                    {article.category}
                  </Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Newspaper className="w-3 h-3" />
                    {article.sourceName}
                  </span>
                </div>

                {/* Título */}
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4">
                  {article.title}
                </h1>

                {/* Fecha y hora */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className="capitalize">{formatDate(article.publishedAt)}</span>
                  <span className="text-slate-300">·</span>
                  <span>{formatTime(article.publishedAt)}</span>
                </div>

                {/* Extracto / descripción */}
                {article.excerpt && (
                  <p className="text-lg text-slate-700 leading-relaxed mb-6 font-medium">
                    {article.excerpt}
                  </p>
                )}

                {/* Contenido completo */}
                {article.content && article.content.trim() && (
                  <div
                    className="prose prose-slate max-w-none text-slate-700 leading-relaxed mb-8
                      prose-headings:font-bold prose-headings:text-slate-900
                      prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-lg prose-img:shadow-sm"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex items-start gap-2 mb-8 flex-wrap">
                    <Tag className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* ── Bloque de compartir destacado ── */}
                <div className="bg-gradient-to-r from-red-50 to-slate-50 rounded-xl p-5 border border-red-100">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    Comparte esta noticia
                  </p>
                  <ShareButtons
                    url={articleUrl}
                    title={article.title}
                    imageUrl={article.imageUrl ?? undefined}
                    alwaysVisible
                  />
                </div>

                {/* Botón "Leer nota completa" */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Leer nota completa en {article.sourceName}
                  </a>
                  <p className="text-xs text-slate-400 mt-2">
                    Esta noticia fue importada desde {article.sourceName}. El contenido original está en su sitio web.
                  </p>
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
