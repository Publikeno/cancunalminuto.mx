import DashboardLayout from "@/components/DashboardLayout";
import { ShareButtons } from "@/components/ShareButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Calendar,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const CATEGORIES = ["Todos", "Cancún", "Quintana Roo", "Nacional", "Deportes", "General"];

const categoryColors: Record<string, string> = {
  "Cancún": "bg-blue-100 text-blue-700 border-blue-200",
  "Quintana Roo": "bg-teal-100 text-teal-700 border-teal-200",
  "Nacional": "bg-purple-100 text-purple-700 border-purple-200",
  "Deportes": "bg-orange-100 text-orange-700 border-orange-200",
  "General": "bg-slate-100 text-slate-700 border-slate-200",
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return formatDate(d);
}

function ArticleSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Skeleton className="h-48 w-full" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

function ArticleCard({ article }: { article: any }) {
  const catColor = categoryColors[article.category] || categoryColors["General"];

  return (
    <a
      href={article.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer border-slate-200">
      <CardContent className="p-0">
        {/* Imagen */}
        <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Zap className="w-10 h-10 text-slate-300" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge className={`text-xs border ${catColor}`} variant="outline">
              {article.category}
            </Badge>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-red-700 transition-colors">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-xs text-slate-500 line-clamp-2 mb-3">
              {article.excerpt}
            </p>
          )}

          {/* Fila inferior: tiempo + fuente + compartir */}
          <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              <span>{timeAgo(article.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-1 min-w-0 shrink">
              <span className="truncate max-w-[80px]">{article.sourceName}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </div>
          </div>

          {/* Botones de compartir — aparecen al hacer hover en la tarjeta */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <ShareButtons url={article.sourceUrl} title={article.title} imageUrl={article.imageUrl} />
          </div>
        </div>
      </CardContent>
    </Card>
    </a>
  );
}

function HeroArticle({ article }: { article: any }) {
  const catColor = categoryColors[article.category] || categoryColors["General"];
  return (
    <div className="relative group">
      <a
        href={article.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative rounded-xl overflow-hidden h-80 bg-gradient-to-br from-slate-800 to-slate-900">
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <Badge className={`text-xs border mb-2 ${catColor}`} variant="outline">
              {article.category}
            </Badge>
            <h2 className="text-white font-bold text-xl leading-tight mb-2 group-hover:text-red-300 transition-colors">
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="text-slate-300 text-sm line-clamp-2 mb-3">{article.excerpt}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(article.publishedAt)}</span>
                </div>
                <span>•</span>
                <span>{article.sourceName}</span>
              </div>
              {/* Botones de compartir en el hero — siempre visibles */}
              <ShareButtons url={article.sourceUrl} title={article.title} imageUrl={article.imageUrl} alwaysVisible />
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const LIMIT = 12;

  const { data, isLoading, refetch, isFetching, error } = trpc.news.getArticles.useQuery({
    limit: LIMIT,
    offset: page * LIMIT,
    category: activeCategory === "Todos" ? undefined : activeCategory,
    search: search || undefined,
  });

  const importMutation = trpc.news.importFromRss.useMutation({
    onSuccess: (result) => {
      refetch();
    },
  });

  const articles = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const heroArticle = articles[0];
  const gridArticles = articles.slice(1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(0);
    setSearch("");
    setSearchInput("");
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            {/* Logo (visible en desktop) */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <img
                src="/manus-storage/cancunalminuto-logo-transparent_341ac187.png"
                alt="Cancún al Minuto"
                className="h-10 w-auto object-contain rounded"
              />
            </div>

            {/* Buscador */}
            <form onSubmit={handleSearch} className="flex-1 max-w-lg flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar noticias..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
              <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                Buscar
              </Button>
            </form>

            {/* Botón importar */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending || isFetching}
              className="gap-2 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${importMutation.isPending ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {importMutation.isPending ? "Importando..." : "Actualizar"}
              </span>
            </Button>
          </div>

          {/* Categorías */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-red-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-4 max-w-7xl mx-auto">
          {/* Estado de búsqueda */}
          {search && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-slate-600">
                Resultados para: <strong>"{search}"</strong> ({total} artículos)
              </span>
              <button
                onClick={() => { setSearch(""); setSearchInput(""); setPage(0); }}
                className="text-xs text-red-600 hover:underline"
              >
                Limpiar
              </button>
            </div>
          )}

          {/* Estado de error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                Error al cargar noticias. Por favor intenta de nuevo.
              </p>
              <button onClick={() => refetch()} className="mt-2 text-xs text-red-600 hover:underline">
                Reintentar
              </button>
            </div>
          )}

          {/* Sin artículos */}
          {!isLoading && !error && articles.length === 0 && (
            <div className="text-center py-20">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {search ? "No se encontraron noticias" : "No hay noticias aún"}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {search
                  ? "Intenta con otras palabras clave"
                  : "Haz clic en 'Actualizar' para importar noticias de las fuentes RSS"}
              </p>
              {!search && (
                <Button
                  onClick={() => importMutation.mutate()}
                  disabled={importMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${importMutation.isPending ? "animate-spin" : ""}`} />
                  Importar noticias ahora
                </Button>
              )}
            </div>
          )}

          {/* Hero article */}
          {!isLoading && heroArticle && (
            <div className="mb-6">
              <HeroArticle article={heroArticle} />
            </div>
          )}
          {isLoading && <Skeleton className="h-80 w-full rounded-xl mb-6" />}

          {/* Grid de artículos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <ArticleSkeleton key={i} />)
              : gridArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Anterior
              </Button>
              <span className="text-sm text-slate-600">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
