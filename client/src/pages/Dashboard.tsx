import { useAdminAuth } from "@/hooks/useAdminAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  Building2,
  CheckCircle,
  CheckSquare,
  Crown,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Rss,
  Search,
  Shield,
  Star,
  Tag,
  Trash2,
  X,
  XCircle,
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

const SUGGESTED_TAGS = [
  "Seguridad", "Política", "Economía", "Turismo", "Cultura",
  "Educación", "Salud", "Medio Ambiente", "Tecnología", "Entretenimiento",
  "Accidente", "Crimen", "Gobierno", "Empresas", "Internacional",
];

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
            <Input id="src-name" placeholder="Ej: Noticaribe" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="src-url">URL del feed RSS</Label>
            <Input id="src-url" placeholder="https://ejemplo.com/feed/" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Categoría por defecto</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
            {addMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal de moderación individual ───────────────────────────────────────────
function ModerateDialog({
  article,
  onClose,
  onSuccess,
}: {
  article: { id: number; title: string; category: string; tags: string | null; sourceName: string; excerpt: string | null };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [category, setCategory] = useState(article.category);
  const [tags, setTags] = useState<string[]>(() => {
    try { return article.tags ? JSON.parse(article.tags) : []; } catch { return []; }
  });
  const [tagInput, setTagInput] = useState("");

  const moderateMutation = trpc.admin.moderateArticle.useMutation({
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handlePublish = () => {
    moderateMutation.mutate({ id: article.id, status: "published", category, tags });
    toast.success("✅ Artículo publicado");
  };

  const handleReject = () => {
    moderateMutation.mutate({ id: article.id, status: "rejected", category, tags });
    toast.info("Artículo rechazado");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-blue-600" />
            Clasificar y moderar artículo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Título y fuente */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-1">
            <p className="text-sm font-semibold line-clamp-3">{article.title}</p>
            <p className="text-xs text-slate-500">{article.sourceName}</p>
            {article.excerpt && (
              <p className="text-xs text-slate-600 line-clamp-2 mt-1">{article.excerpt}</p>
            )}
          </div>

          {/* Categoría */}
          <div className="space-y-1">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Etiquetas */}
          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Agregar etiqueta..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
                className="flex-1"
              />
              <Button size="sm" variant="outline" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Etiquetas actuales */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 text-xs bg-blue-100 text-blue-700">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Sugerencias */}
            <div className="flex flex-wrap gap-1">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            disabled={moderateMutation.isPending}
            onClick={handleReject}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Rechazar
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={moderateMutation.isPending}
            onClick={handlePublish}
          >
            {moderateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-1" />
            )}
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Panel de Moderación ───────────────────────────────────────────────────────
function ModerationPanel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"pending" | "published" | "rejected" | "all">("pending");
  const [offset, setOffset] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [moderatingArticle, setModeratingArticle] = useState<null | {
    id: number; title: string; category: string; tags: string | null; sourceName: string; excerpt: string | null;
  }>(null);

  const LIMIT = 20;

  const { data: pendingCount, refetch: refetchCount } = trpc.admin.getPendingCount.useQuery();

  const { data, isLoading, refetch } = trpc.admin.getArticlesByStatus.useQuery({
    status: statusFilter,
    limit: LIMIT,
    offset,
    search: search || undefined,
  });

  const bulkMutation = trpc.admin.bulkModerate.useMutation({
    onSuccess: (res) => {
      toast.success(`${res.count} artículos actualizados`);
      setSelectedIds([]);
      refetch();
      refetchCount();
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (!data?.items) return;
    const allIds = data.items.map((a) => a.id);
    setSelectedIds(selectedIds.length === allIds.length ? [] : allIds);
  };

  const statusBadge = (status: string) => {
    if (status === "published") return <Badge className="text-xs bg-green-100 text-green-700 border-0">Publicado</Badge>;
    if (status === "rejected") return <Badge className="text-xs bg-red-100 text-red-700 border-0">Rechazado</Badge>;
    return <Badge className="text-xs bg-amber-100 text-amber-700 border-0">Pendiente</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Buscar artículos..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setOffset(0); setSelectedIds([]); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">
              Pendientes {pendingCount?.count ? `(${pendingCount.count})` : ""}
            </SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="rejected">Rechazados</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>

        {/* Acciones en lote */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-slate-500">{selectedIds.length} seleccionados</span>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white gap-1"
              disabled={bulkMutation.isPending}
              onClick={() => bulkMutation.mutate({ ids: selectedIds, status: "published" })}
            >
              <CheckSquare className="w-4 h-4" />
              Publicar todos
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 gap-1"
              disabled={bulkMutation.isPending}
              onClick={() => bulkMutation.mutate({ ids: selectedIds, status: "rejected" })}
            >
              <XCircle className="w-4 h-4" />
              Rechazar todos
            </Button>
          </div>
        )}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.length > 0 && selectedIds.length === data?.items.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Etiquetas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-slate-400 py-8">
                      No hay artículos {statusFilter === "pending" ? "pendientes" : "en esta categoría"}
                    </TableCell>
                  </TableRow>
                )}
                {data?.items.map((article) => {
                  const parsedTags: string[] = (() => {
                    try { return article.tags ? JSON.parse(article.tags) : []; } catch { return []; }
                  })();

                  return (
                    <TableRow key={article.id} className={selectedIds.includes(article.id) ? "bg-blue-50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(article.id)}
                          onCheckedChange={() => toggleSelect(article.id)}
                        />
                      </TableCell>
                      <TableCell className="max-w-[250px]">
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
                      <TableCell className="max-w-[150px]">
                        <div className="flex flex-wrap gap-1">
                          {parsedTags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs bg-blue-50 text-blue-600 border-0">
                              {tag}
                            </Badge>
                          ))}
                          {parsedTags.length > 2 && (
                            <span className="text-xs text-slate-400">+{parsedTags.length - 2}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(article.status)}</TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(article.publishedAt).toLocaleDateString("es-MX")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setModeratingArticle({
                            id: article.id,
                            title: article.title,
                            category: article.category,
                            tags: article.tags ?? null,
                            sourceName: article.sourceName,
                            excerpt: article.excerpt ?? null,
                          })}
                        >
                          <Tag className="w-3 h-3" />
                          Clasificar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))}>
                  Anterior
                </Button>
                <Button size="sm" variant="outline" disabled={offset + LIMIT >= data.total} onClick={() => setOffset(offset + LIMIT)}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de moderación */}
      {moderatingArticle && (
        <ModerateDialog
          article={moderatingArticle}
          onClose={() => setModeratingArticle(null)}
          onSuccess={() => { refetch(); refetchCount(); }}
        />
      )}
    </div>
  );
}

// ── Panel de fuentes RSS ──────────────────────────────────────────────────────
function SourcesPanel() {
  const { data: sources, isLoading, refetch } = trpc.admin.getSources.useQuery();
  const [showAdd, setShowAdd] = useState(false);

  const importMutation = trpc.admin.importNow.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ Importados ${data.imported} artículos de ${data.sources.length} fuentes — ahora clasifícalos en Moderación`);
      refetch();
    },
    onError: (e) => toast.error(`Error al importar: ${e.message}`),
  });

  const toggleMutation = trpc.admin.updateSource.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  const deleteMutation = trpc.admin.deleteSource.useMutation({
    onSuccess: () => { toast.success("Fuente eliminada"); refetch(); },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {sources ? `${sources.length} fuentes configuradas` : "Cargando..."}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="gap-1">
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
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
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
                    <Badge variant="secondary" className={`text-xs ${categoryColors[source.category] || categoryColors["General"]}`}>
                      {source.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-slate-500">{source.url}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {source.lastFetched ? new Date(source.lastFetched).toLocaleString("es-MX") : "Nunca"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={source.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}>
                      {source.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm" variant="ghost" className="h-7 px-2"
                        onClick={() => toggleMutation.mutate({ id: source.id, active: !source.active })}
                      >
                        {source.active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => { if (confirm(`¿Eliminar la fuente "${source.name}"?`)) deleteMutation.mutate({ id: source.id }); }}
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

      <AddSourceDialog open={showAdd} onClose={() => setShowAdd(false)} onSuccess={() => refetch()} />
    </div>
  );
}

// ── Panel de artículos publicados ─────────────────────────────────────────────
function ArticlesPanel() {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const LIMIT = 30;

  const { data, isLoading, refetch } = trpc.admin.getArticles.useQuery({ limit: LIMIT, offset, search: search || undefined });

  const hideMutation = trpc.admin.hideArticle.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  const deleteMutation = trpc.admin.deleteArticle.useMutation({
    onSuccess: () => { toast.success("Artículo eliminado"); refetch(); },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pl-9" placeholder="Buscar artículos..." value={search} onChange={(e) => { setSearch(e.target.value); setOffset(0); }} />
        </div>
        <p className="text-sm text-slate-500">{data ? `${data.total} artículos` : ""}</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
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
                  <TableHead>Visibilidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((article) => (
                  <TableRow key={article.id} className={article.hidden ? "opacity-50" : ""}>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm font-medium line-clamp-2">{article.title}</p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{article.sourceName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${categoryColors[article.category] || categoryColors["General"]}`}>
                        {article.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(article.publishedAt).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${article.hidden ? "bg-slate-100 text-slate-500" : "bg-green-100 text-green-700"}`}>
                        {article.hidden ? "Oculto" : "Visible"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => hideMutation.mutate({ id: article.id, hidden: !article.hidden })}>
                          {article.hidden ? <Eye className="w-3 h-3 text-green-600" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => { if (confirm("¿Eliminar este artículo permanentemente?")) deleteMutation.mutate({ id: article.id }); }}
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

          {data && data.total > LIMIT && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Mostrando {offset + 1}–{Math.min(offset + LIMIT, data.total)} de {data.total}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))}>Anterior</Button>
                <Button size="sm" variant="outline" disabled={offset + LIMIT >= data.total} onClick={() => setOffset(offset + LIMIT)}>Siguiente</Button>
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
  const { isAuthenticated, isLoading: authLoading, logout } = useAdminAuth();
  const { data: pendingCount } = trpc.admin.getPendingCount.useQuery(undefined, { enabled: isAuthenticated });

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null; // useAdminAuth redirige automáticamente a /admin/login
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
              <span className="text-sm text-slate-600">Administrador</span>
              <Button size="sm" variant="outline" className="h-7 text-xs ml-2" onClick={logout}>
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 max-w-6xl mx-auto">
          <Tabs defaultValue="moderation">
            <TabsList className="mb-4">
              <TabsTrigger value="moderation" className="gap-2">
                <Tag className="w-4 h-4" />
                Moderación
                {pendingCount && pendingCount.count > 0 && (
                  <Badge className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0 h-4">
                    {pendingCount.count}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sources" className="gap-2">
                <Rss className="w-4 h-4" />
                Fuentes RSS
              </TabsTrigger>
              <TabsTrigger value="articles" className="gap-2">
                <Eye className="w-4 h-4" />
                Artículos
              </TabsTrigger>
              <TabsTrigger value="directory" className="gap-2">
                <Building2 className="w-4 h-4" />
                Directorio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="moderation">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-500" />
                    Clasificar y publicar noticias
                    {pendingCount && pendingCount.count > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                        {pendingCount.count} pendientes
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Revisa cada noticia, asígnale categoría y etiquetas, luego publícala o recházala. También puedes seleccionar varias y publicarlas o rechazarlas en lote.
                  </p>
                </CardHeader>
                <CardContent>
                  <ModerationPanel />
                </CardContent>
              </Card>
            </TabsContent>

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
                  <CardTitle className="text-base">Artículos Publicados</CardTitle>
                </CardHeader>
                <CardContent>
                  <ArticlesPanel />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="directory">
              <DirectoryAdminPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Panel de administración del Directorio ────────────────────────────────────
function DirectoryAdminPanel() {
  const [tab, setTab] = useState<"listings" | "reviews" | "subscriptions">("listings");
  const [statusFilter, setStatusFilter] = useState<"pending" | "active" | "suspended">("pending");

  const { data: listings, refetch: refetchListings } = trpc.directory.adminList.useQuery({
    status: statusFilter,
    limit: 50,
    offset: 0,
  });

  const { data: pendingReviews, refetch: refetchReviews } = trpc.directory.adminGetPendingReviews.useQuery();
  const { data: subscriptions } = trpc.directory.adminGetSubscriptions.useQuery();

  const approve = trpc.directory.adminApprove.useMutation({
    onSuccess: () => { toast.success("Estado actualizado"); refetchListings(); },
    onError: (e) => toast.error(e.message),
  });

  const moderateReview = trpc.directory.adminModerateReview.useMutation({
    onSuccess: () => { toast.success("Reseña moderada"); refetchReviews(); },
    onError: (e) => toast.error(e.message),
  });

  const updatePlan = trpc.directory.adminUpdatePlan.useMutation({
    onSuccess: () => { toast.success("Plan actualizado"); refetchListings(); },
    onError: (e) => toast.error(e.message),
  });

  const PLAN_COLORS: Record<string, string> = {
    basico: "bg-gray-100 text-gray-700",
    profesional: "bg-blue-100 text-blue-700",
    premium: "bg-amber-100 text-amber-700",
  };
  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    active: "bg-green-100 text-green-700",
    suspended: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {(["listings", "reviews", "subscriptions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t ? "bg-red-700 text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "listings" ? "Negocios" : t === "reviews" ? `Reseñas (${pendingReviews?.length ?? 0})` : "Suscripciones"}
          </button>
        ))}
      </div>

      {/* Negocios */}
      {tab === "listings" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["pending", "active", "suspended"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === s ? "bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground"
                }`}
              >
                {s === "pending" ? "Pendientes" : s === "active" ? "Activos" : "Suspendidos"}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Visitas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings?.items.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No hay negocios en este estado</TableCell></TableRow>
                )}
                {listings?.items.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="font-medium text-sm text-foreground">{l.name}</div>
                      <div className="text-xs text-muted-foreground">{l.email ?? l.phone ?? "Sin contacto"}</div>
                    </TableCell>
                    <TableCell><span className="text-xs capitalize">{l.category}</span></TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PLAN_COLORS[l.plan] ?? ""}`}>
                        {l.plan}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[l.status] ?? ""}`}>
                        {l.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.viewCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {l.status !== "active" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => approve.mutate({ id: l.id, status: "active" })}>
                            Activar
                          </Button>
                        )}
                        {l.status !== "suspended" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => approve.mutate({ id: l.id, status: "suspended" })}>
                            Suspender
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => updatePlan.mutate({ listingId: l.id, plan: "premium", months: 1 })}>
                          <Crown className="w-3 h-3 mr-1" /> Premium
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Reseñas pendientes */}
      {tab === "reviews" && (
        <div className="space-y-3">
          {pendingReviews?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">No hay reseñas pendientes</div>
          )}
          {pendingReviews?.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">{r.authorName}</span>
                      <div className="flex">
                        {[1,2,3,4,5].map((i) => (
                          <Star key={i} className={`w-3 h-3 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">Negocio #{r.listingId}</span>
                    </div>
                    {r.title && <p className="text-sm font-medium text-foreground">{r.title}</p>}
                    {r.body && <p className="text-sm text-muted-foreground mt-1">{r.body}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => moderateReview.mutate({ id: r.id, status: "approved" })}>
                      Aprobar
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-700 border-red-300"
                      onClick={() => moderateReview.mutate({ id: r.id, status: "rejected" })}>
                      Rechazar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Suscripciones activas */}
      {tab === "subscriptions" && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio ID</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Precio/mes</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions?.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No hay suscripciones activas</TableCell></TableRow>
              )}
              {subscriptions?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{s.listingId}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PLAN_COLORS[s.plan] ?? ""}`}>
                      {s.plan}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">${s.priceMonthly.toLocaleString()} MXN</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(s.startDate).toLocaleDateString("es-MX")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(s.endDate).toLocaleDateString("es-MX")}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {s.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
