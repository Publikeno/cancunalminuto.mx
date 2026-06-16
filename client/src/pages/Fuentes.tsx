import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Clock, RefreshCw, Rss } from "lucide-react";

const categoryColors: Record<string, string> = {
  "Cancún": "bg-blue-100 text-blue-700",
  "Quintana Roo": "bg-teal-100 text-teal-700",
  "Nacional": "bg-purple-100 text-purple-700",
  "Deportes": "bg-orange-100 text-orange-700",
  "General": "bg-slate-100 text-slate-700",
};

export default function Fuentes() {
  const { data: sources, isLoading, refetch } = trpc.news.getSources.useQuery();
  const importMutation = trpc.news.importFromRss.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rss className="w-5 h-5 text-red-600" />
              <h1 className="text-xl font-bold text-slate-900">Fuentes RSS</h1>
              {sources && (
                <span className="text-sm text-slate-500">({sources.length} fuentes)</span>
              )}
            </div>
            <Button
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 ${importMutation.isPending ? "animate-spin" : ""}`} />
              {importMutation.isPending ? "Importando..." : "Importar ahora"}
            </Button>
          </div>
        </div>

        <div className="p-4 max-w-4xl mx-auto">
          {importMutation.isSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                Se importaron {importMutation.data.imported} artículos de {importMutation.data.sources.length} fuentes.
              </span>
            </div>
          )}

          <div className="grid gap-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))
              : sources?.map((source) => (
                  <Card key={source.id} className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 text-sm">{source.name}</h3>
                            <Badge
                              className={`text-xs ${categoryColors[source.category] || categoryColors["General"]}`}
                              variant="secondary"
                            >
                              {source.category}
                            </Badge>
                            {source.active ? (
                              <Badge className="text-xs bg-green-100 text-green-700" variant="secondary">
                                Activa
                              </Badge>
                            ) : (
                              <Badge className="text-xs bg-slate-100 text-slate-500" variant="secondary">
                                Inactiva
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{source.url}</p>
                          {source.lastFetched && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>
                                Última importación:{" "}
                                {new Date(source.lastFetched).toLocaleString("es-MX")}
                              </span>
                            </div>
                          )}
                        </div>
                        <Rss className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                      </div>
                    </CardContent>
                  </Card>
                ))}

            {!isLoading && (!sources || sources.length === 0) && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Rss className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm mb-4">
                    No hay fuentes RSS configuradas. Haz clic en "Importar ahora" para inicializar las fuentes por defecto.
                  </p>
                  <Button
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${importMutation.isPending ? "animate-spin" : ""}`} />
                    Inicializar fuentes
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
