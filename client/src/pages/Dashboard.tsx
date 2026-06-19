import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Rss,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CATEGORIES = ["Cancún", "Quintana Roo", "Nacional", "Deportes", "General"];

const categoryColors: Record<string, string> = {
  "Cancún": "bg-blue-100 text-blue-700",
  "Quintana Roo": "bg-teal-100 text-teal-700",
  "Nacional": "bg-purple-100 text-purple-700",
  "Deportes": "bg-orange-100 text-orange-700",
  "General": "bg-slate-100 text-slate-700",
};

// ── Formulario para agregar fuente ────────────────────────────────────────────
function AddSourceDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("General");

  const addMutation = trpc.admin.addSource.useMutation({
    onSuccess: () => {
      toast.success("Fuente agregada correctamente");
      setName(""); setUrl(""); setCategory("General");
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rss className="w-4 h-4 text-red-600" />
            Agregar fuente RSS
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="src-name">Nombre</Label>
            <Input
              id="src-name"
              placeholder="Ej: Noticaribe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="src-url">URL del feed RSS</Label>
            <Input
              id="src-url"
              placeholder="https://ejemplo.com/feed/"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={!name || !url || addMutation.isPending}
            onClick={() => addMutation.mutate({ name, url, category })}
          >
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Panel de fuentes RSS ──────────────────────────────────────────────────────
function SourcesPanel() {
  const { data: sources, isLoading, refetch } = trpc.admin.getSources.useQuery();
  const [showAdd, setShowAdd] = useState(false);

  const importMutation = trpc.admin.importNow.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ Importados ${data.imported} artículos de ${data.sources.length} fuentes`);
      refetch();
    },
    onError: (e) => toast.error(`Error al importar: ${e.message}`),
  });

  const toggleMutation = trpc.admin.updateSource.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  const deleteMutation = trpc.admin.deleteSource.useMutation({
    onSuccess: () => {
      toast.success("Fuente eliminada");
      refetch();
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {sources ? `${sources.length} fuentes configuradas` : "Cargando..."}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAdd(true)}
            className="gap-1"
          >
            <Plus className="w-4 h-4" /> Agregar fuente
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white gap-1"
            disabled={importMutation.isPending}
            onClick={() => importMutation.mutate()}
          >
            <RefreshCw className={`w-4 h-4 ${importMutation.isPending ? "animate-spin" : ""}`} />
            {importMutation.isPending ? "Importando..." : "Importar ahora"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Última importación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources?.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${categoryColors[source.category] || categoryColors["General"]}`}
                    >
                      {source.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-slate-500">
                    {source.url}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {source.lastFetched
                      ? new Date(source.lastFetched).toLocaleString("es-MX")
                      : "Nunca"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={source.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}
                    >
                      {source.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          toggleMutation.mutate({ id: source.id, active: !source.active })
                        }
                      >
                        {source.active ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`¿Eliminar la fuente "${source.name}"?`)) {
                            deleteMutation.mutate({ id: source.id });
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddSourceDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

// ── Panel de artículos ────────────────────────────────────────────────────────
function ArticlesPanel() {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const LIMIT = 30;

  const { data, isLoading, refetch } = trpc.admin.getArticles.useQuery({
    limit: LIMIT,
    offset,
    search: search || undefined,
  });

  const hideMutation = trpc.admin.hideArticle.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  const deleteMutation = trpc.admin.deleteArticle.useMutation({
    onSuccess: () => {
      toast.success("Artículo eliminado");
      refetch();
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Buscar artículos..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          />
        </div>
        <p className="text-sm text-slate-500">
          {data ? `${data.total} artículos en total` : ""}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((article) => (
                  <TableRow key={article.id} className={article.hidden ? "opacity-50" : ""}>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm font-medium line-clamp-2">{article.title}</p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {article.sourceName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${categoryColors[article.category] || categoryColors["General"]}`}
                      >
                        {article.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(article.publishedAt).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell>
                      {article.hidden ? (
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-500">
                          Oculto
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Visible
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          title={article.hidden ? "Mostrar" : "Ocultar"}
                          onClick={() =>
                            hideMutation.mutate({ id: article.id, hidden: !article.hidden })
                          }
                        >
                          {article.hidden ? (
                            <Eye className="w-3 h-3 text-green-600" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-slate-500" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar"
                          onClick={() => {
                            if (confirm("¿Eliminar este artículo permanentemente?")) {
                              deleteMutation.mutate({ id: article.id });
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {data && data.total > LIMIT && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Mostrando {offset + 1}–{Math.min(offset + LIMIT, data.total)} de {data.total}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={offset + LIMIT >= data.total}
                  onClick={() => setOffset(offset + LIMIT)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Página principal del Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
          <Shield className="w-12 h-12 text-slate-400" />
          <h2 className="text-xl font-bold text-slate-800">Acceso restringido</h2>
          <p className="text-slate-500 max-w-sm">
            Debes iniciar sesión para acceder al panel de administración.
          </p>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Iniciar sesión
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
          <AlertTriangle className="w-12 h-12 text-amber-400" />
          <h2 className="text-xl font-bold text-slate-800">Sin permisos de administrador</h2>
          <p className="text-slate-500 max-w-sm">
            Tu cuenta no tiene permisos de administrador. Contacta al propietario del sitio.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">Panel de Administración</h1>
                <p className="text-xs text-slate-500">Cancún al Minuto</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-slate-600">Admin: {user.name || user.email}</span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 max-w-6xl mx-auto">
          <Tabs defaultValue="sources">
            <TabsList className="mb-4">
              <TabsTrigger value="sources" className="gap-2">
                <Rss className="w-4 h-4" />
                Fuentes RSS
              </TabsTrigger>
              <TabsTrigger value="articles" className="gap-2">
                <Search className="w-4 h-4" />
                Artículos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sources">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Gestión de Fuentes RSS</CardTitle>
                </CardHeader>
                <CardContent>
                  <SourcesPanel />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="articles">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Gestión de Artículos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ArticlesPanel />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
