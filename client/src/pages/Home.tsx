import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Zap, TrendingUp, Clock, CheckCircle, AlertCircle, Settings, FileText, Rss, RefreshCw, ExternalLink, Lock, LogOut } from "lucide-react";
import { useWordPressData } from "@/hooks/useWordPressData";
import { fetchAllPosts } from "@/lib/wpService";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DASHBOARD_CODE = "032332";

const LoginModal = ({ isOpen, onLogin }: { isOpen: boolean; onLogin: () => void }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === DASHBOARD_CODE) {
      localStorage.setItem("dashboardAccess", "true");
      setCode("");
      setError("");
      onLogin();
    } else {
      setError("Código incorrecto");
      setCode("");
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Acceso Restringido
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ingresa el código de 6 dígitos para acceder al dashboard
          </p>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError("");
            }}
            className="text-center text-2xl tracking-widest font-mono"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={code.length !== 6}>
            Acceder
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const StatCard = ({ label, value, icon: Icon, trend, loading }: any) => (
  <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div>
          <CardDescription className="text-slate-600">{label}</CardDescription>
          {loading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          )}
        </div>
        <div className="bg-blue-50 p-2 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-4 w-16" />
      ) : (
        <p className="text-xs text-green-600 font-medium">{trend}</p>
      )}
    </CardContent>
  </Card>
);

export default function Home() {
  const [, setLocation] = useLocation();
  const { stats, dailyStats, recentLogs, rssSources, loading, error, refetch } = useWordPressData();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    const hasAccess = localStorage.getItem("dashboardAccess") === "true";
    setIsAuthenticated(hasAccess);
    if (!hasAccess) {
      setShowLogin(true);
    }
    
    // Cargar posts recientes
    const loadPosts = async () => {
      const posts = await fetchAllPosts();
      setRecentPosts(posts.slice(0, 5));
    };
    loadPosts();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("dashboardAccess");
    setIsAuthenticated(false);
    setShowLogin(true);
  };

  if (!isAuthenticated) {
    return (
      <LoginModal
        isOpen={showLogin}
        onLogin={() => {
          setIsAuthenticated(true);
          setShowLogin(false);
        }}
      />
    );
  }

  const dashboardStats = [
    { label: "Artículos Procesados", value: stats?.totalProcessed || 0, icon: FileText, trend: stats?.trendProcessed || "+0%" },
    { label: "Artículos Generados", value: stats?.totalGenerated || 0, icon: Zap, trend: stats?.trendGenerated || "+0%" },
    { label: "Artículos Publicados", value: stats?.totalPublished || 0, icon: CheckCircle, trend: stats?.trendPublished || "+0%" },
    { label: "Fuentes RSS", value: stats?.totalSources || 0, icon: Rss, trend: stats?.trendSources || "+0" },
  ];

  const statusColors = {
    "Completado": "bg-green-50 text-green-700 border-green-200",
    "En progreso": "bg-blue-50 text-blue-700 border-blue-200",
    "Error": "bg-red-50 text-red-700 border-red-200",
  };

  const statusIcons = {
    "Completado": <CheckCircle className="w-4 h-4" />,
    "En progreso": <Clock className="w-4 h-4 animate-spin" />,
    "Error": <AlertCircle className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Cancún al Minuto</h1>
              <p className="text-xs text-slate-500">Dashboard de Automatización</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Actualizando..." : "Actualizar"}
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Hero Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-lg">
            <h2 className="text-3xl font-bold mb-2">Dashboard de Automatización de Noticias</h2>
            <p className="text-blue-100 mb-6">
              Monitorea en tiempo real la generación y publicación de artículos desde tu WordPress.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button 
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => setLocation("#estadisticas")}
              >
                Comenzar
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-blue-600/20 gap-2"
                onClick={() => window.open('https://cancunalminuto.mx', '_blank')}
              >
                Ir a WordPress
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div id="estadisticas" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {dashboardStats.map((stat, idx) => (
            <StatCard key={idx} {...stat} loading={loading} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Line Chart */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Tendencia de Artículos</CardTitle>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              {loading || dailyStats.length === 0 ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-spin" />
                    <p className="text-sm text-slate-500">Cargando datos...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px" }}
                      labelStyle={{ color: "#0f172a" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="procesados" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                    <Line type="monotone" dataKey="generados" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
                    <Line type="monotone" dataKey="publicados" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Distribución por Estado</CardTitle>
              <CardDescription>Resumen actual</CardDescription>
            </CardHeader>
            <CardContent>
              {loading || !stats ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-spin" />
                    <p className="text-sm text-slate-500">Cargando datos...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { estado: "Procesados", cantidad: stats.totalProcessed },
                      { estado: "Generados", cantidad: stats.totalGenerated },
                      { estado: "Publicados", cantidad: stats.totalPublished },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="estado" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px" }}
                      labelStyle={{ color: "#0f172a" }}
                    />
                    <Bar dataKey="cantidad" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="logs" className="mb-8">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100">
            <TabsTrigger value="noticias">Noticias</TabsTrigger>
            <TabsTrigger value="logs">Registros Recientes</TabsTrigger>
            <TabsTrigger value="sources">Fuentes RSS</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="noticias" className="mt-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Noticias Recientes</CardTitle>
                <CardDescription>Últimos artículos publicados en WordPress</CardDescription>
              </CardHeader>
              <CardContent>
                {loading || recentPosts.length === 0 ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <h3 className="font-semibold text-slate-900 mb-1">{post.title.rendered}</h3>
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">{post.excerpt.rendered.replace(/<[^>]*>/g, '')}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{new Date(post.date).toLocaleDateString('es-MX')}</span>
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{post.status === 'publish' ? 'Publicado' : 'Borrador'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Historial de Publicaciones</CardTitle>
                <CardDescription>Últimas acciones ejecutadas</CardDescription>
              </CardHeader>
              <CardContent>
                {loading || recentLogs.length === 0 ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0">
                            {statusIcons[log.status as keyof typeof statusIcons]}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{log.action}</p>
                            <p className="text-xs text-slate-500">{log.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[log.status as keyof typeof statusColors]}`}>
                            {log.status}
                          </span>
                          <span className="text-sm font-medium text-slate-700">{log.articles} artículos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="mt-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Fuentes RSS Configuradas</CardTitle>
                <CardDescription>Categorías de contenido activas</CardDescription>
              </CardHeader>
              <CardContent>
                {loading || rssSources.length === 0 ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rssSources.map((source, idx) => (
                      <div key={idx} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{source.name}</p>
                            <p className="text-xs text-slate-500 mt-1 truncate">{source.url}</p>
                          </div>
                          <span className="text-sm font-medium text-slate-700 ml-4">{source.articles}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Configuración del Dashboard</CardTitle>
                <CardDescription>Personaliza tu experiencia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Datos en Tiempo Real</p>
                    <p className="text-xs text-blue-700 mt-1">Este dashboard se actualiza automáticamente cada 30 segundos con los últimos datos de tu WordPress.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <span className="text-sm font-medium text-slate-900">Notificaciones por correo</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <span className="text-sm font-medium text-slate-900">Resumen diario</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <span className="text-sm font-medium text-slate-900">Alertas de errores</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
