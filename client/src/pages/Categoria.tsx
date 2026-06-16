import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Clock, ExternalLink, Zap } from "lucide-react";
import { useParams } from "wouter";

const categoryMap: Record<string, string> = {
  "cancun": "Cancún",
  "quintana-roo": "Quintana Roo",
  "nacional": "Nacional",
  "deportes": "Deportes",
  "general": "General",
};

const categoryColors: Record<string, string> = {
  "Cancún": "bg-blue-100 text-blue-700 border-blue-200",
  "Quintana Roo": "bg-teal-100 text-teal-700 border-teal-200",
  "Nacional": "bg-purple-100 text-purple-700 border-purple-200",
  "Deportes": "bg-orange-100 text-orange-700 border-orange-200",
  "General": "bg-slate-100 text-slate-700 border-slate-200",
};

function timeAgo(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export default function Categoria() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const categoryName = categoryMap[slug] ?? slug;
  const catColor = categoryColors[categoryName] || categoryColors["General"];

  const { data, isLoading } = trpc.news.getArticles.useQuery({
    limit: 24,
    offset: 0,
    category: categoryName,
  });

  const articles = data?.items ?? [];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Header de categoría */}
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <Badge className={`text-sm border px-3 py-1 ${catColor}`} variant="outline">
              {categoryName}
            </Badge>
            <h1 className="text-xl font-bold text-slate-900">
              Noticias de {categoryName}
            </h1>
            {data && (
              <span className="text-sm text-slate-500">({data.total} artículos)</span>
            )}
          </div>
        </div>

        <div className="p-4 max-w-7xl mx-auto">
          {!isLoading && articles.length === 0 && (
            <div className="text-center py-20">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No hay noticias en esta categoría aún.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-0">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              : articles.map((article) => (
                  <a
                    key={article.id}
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-slate-200 h-full">
                      <CardContent className="p-0 flex flex-col h-full">
                        <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                          {article.imageUrl ? (
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Zap className="w-10 h-10 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-red-700 transition-colors flex-1">
                            {article.title}
                          </h3>
                          {article.excerpt && (
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{article.excerpt}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-slate-400 mt-auto">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{timeAgo(article.publishedAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="truncate max-w-[80px]">{article.sourceName}</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
