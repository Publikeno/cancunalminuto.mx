import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin, Phone, Globe, Star, Search, Building2, Utensils,
  Hotel, Compass, Home, Scale, Stethoscope, GraduationCap,
  Wrench, ChevronRight, Plus, Map, List, Crown, BadgeCheck,
  MessageCircle, Eye
} from "lucide-react";

const CATEGORIES = [
  { id: "todos", label: "Todos", icon: Building2, color: "bg-gray-100 text-gray-700" },
  { id: "restaurantes", label: "Restaurantes", icon: Utensils, color: "bg-orange-100 text-orange-700" },
  { id: "hoteles", label: "Hoteles", icon: Hotel, color: "bg-blue-100 text-blue-700" },
  { id: "tours", label: "Tours", icon: Compass, color: "bg-green-100 text-green-700" },
  { id: "inmobiliarias", label: "Inmobiliarias", icon: Home, color: "bg-purple-100 text-purple-700" },
  { id: "abogados", label: "Abogados", icon: Scale, color: "bg-indigo-100 text-indigo-700" },
  { id: "medicos", label: "Médicos", icon: Stethoscope, color: "bg-red-100 text-red-700" },
  { id: "escuelas", label: "Escuelas", icon: GraduationCap, color: "bg-yellow-100 text-yellow-700" },
  { id: "talleres", label: "Talleres", icon: Wrench, color: "bg-slate-100 text-slate-700" },
] as const;

const PLAN_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  premium: { label: "Premium", color: "bg-amber-100 text-amber-800 border-amber-300", icon: Crown },
  profesional: { label: "Profesional", color: "bg-blue-100 text-blue-800 border-blue-300", icon: BadgeCheck },
  basico: { label: "Básico", color: "bg-gray-100 text-gray-600 border-gray-200", icon: null },
};

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${s} ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const info = PLAN_BADGES[plan] ?? PLAN_BADGES.basico;
  if (plan === "basico") return null;
  const Icon = info.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${info.color}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {info.label}
    </span>
  );
}

function ListingCard({ listing }: { listing: any }) {
  const cat = CATEGORIES.find((c) => c.id === listing.category);
  const Icon = cat?.icon ?? Building2;

  return (
    <Link href={`/directorio/${listing.id}`}>
      <Card className={`group hover:shadow-lg transition-all duration-200 cursor-pointer border ${listing.featured ? "border-amber-300 shadow-amber-50" : "border-border"} ${listing.plan === "premium" ? "ring-1 ring-amber-200" : ""}`}>
        <CardContent className="p-0">
          {/* Cover */}
          <div className="relative h-36 bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-lg overflow-hidden">
            {listing.coverUrl ? (
              <img src={listing.coverUrl} alt={listing.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon className="w-12 h-12 text-slate-300" />
              </div>
            )}
            {listing.featured && (
              <div className="absolute top-2 left-2">
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Destacado
                </span>
              </div>
            )}
            {listing.verified && (
              <div className="absolute top-2 right-2">
                <BadgeCheck className="w-5 h-5 text-blue-500 bg-white rounded-full" />
              </div>
            )}
          </div>

          {/* Logo + info */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              {listing.logoUrl ? (
                <img src={listing.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0" />
              ) : (
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cat?.color ?? "bg-gray-100 text-gray-600"}`}>
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{listing.name}</h3>
                  <PlanBadge plan={listing.plan} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {listing.shortDescription ?? listing.description?.substring(0, 100)}
                </p>
              </div>
            </div>

            {/* Meta */}
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                {listing.neighborhood && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {listing.neighborhood}
                  </span>
                )}
                {listing.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {listing.phone}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.viewCount}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{listing.contactCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Directorio() {
  const [category, setCategory] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const { data, isLoading } = trpc.directory.list.useQuery({
    category: category !== "todos" ? (category as any) : undefined,
    search: debouncedSearch || undefined,
    limit: 50,
    offset: 0,
  });

  const { data: plans } = trpc.directory.getPlans.useQuery();

  // Markers para el mapa
  const markers = useMemo(() => {
    return (data?.items ?? [])
      .filter((l) => l.lat && l.lng)
      .map((l) => ({
        id: l.id,
        lat: parseFloat(l.lat!),
        lng: parseFloat(l.lng!),
        name: l.name,
        category: l.category,
      }));
  }, [data]);

  // Inicializar marcadores en el mapa
  const handleMapReady = (map: google.maps.Map) => {
    setMapInstance(map);
    markers.forEach((m) => {
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        title: m.name,
      });
      const info = new google.maps.InfoWindow({
        content: `<div style="font-size:13px;font-weight:600">${m.name}</div><div style="font-size:11px;color:#666">${m.category}</div>`,
      });
      marker.addListener("click", () => info.open(map, marker));
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Directorio Comercial Cancún</h1>
          <p className="text-red-100 mb-6">Encuentra los mejores negocios y servicios en Cancún y la Riviera Maya</p>
          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar restaurante, hotel, abogado..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-white text-foreground border-0 shadow-lg h-11"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  active
                    ? "bg-red-700 text-white border-red-700 shadow-md"
                    : "bg-white text-foreground border-border hover:border-red-300 hover:text-red-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Cargando..." : `${data?.total ?? 0} negocios encontrados`}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-red-700 text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2 ${viewMode === "map" ? "bg-red-700 text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
            <Link href="/directorio/registrar">
              <Button size="sm" className="bg-red-700 hover:bg-red-800 text-white gap-1">
                <Plus className="w-4 h-4" /> Registrar negocio
              </Button>
            </Link>
          </div>
        </div>

        {/* Vista mapa */}
        {viewMode === "map" && (
          <div className="mb-6 rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: 420 }}>
              <MapView
              onMapReady={handleMapReady}
              initialCenter={{ lat: 21.1619, lng: -86.8515 }}
              initialZoom={12}
            />
          </div>
        )}

        {/* Grid de listados */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No se encontraron negocios</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Intenta con otro término de búsqueda" : "Sé el primero en registrar tu negocio"}
            </p>
            <Link href="/directorio/registrar">
              <Button className="mt-4 bg-red-700 hover:bg-red-800 text-white">
                <Plus className="w-4 h-4 mr-2" /> Registrar mi negocio
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* Sección de planes */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Registra tu negocio</h2>
            <p className="text-muted-foreground mt-2">Llega a miles de clientes en Cancún y la Riviera Maya</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans?.map((plan) => (
              <Card
                key={plan.id}
                className={`relative overflow-hidden ${plan.id === "profesional" ? "border-blue-400 shadow-lg shadow-blue-50 scale-105" : ""} ${plan.id === "premium" ? "border-amber-400" : ""}`}
              >
                {plan.badge && (
                  <div className={`absolute top-0 right-0 text-xs font-bold px-3 py-1 rounded-bl-lg ${plan.id === "profesional" ? "bg-blue-600 text-white" : "bg-amber-500 text-white"}`}>
                    {plan.badge}
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-foreground">Gratis</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-foreground">${plan.price.toLocaleString()}</span>
                        <span className="text-muted-foreground text-sm"> MXN/mes</span>
                      </>
                    )}
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-green-500 mt-0.5">✓</span> {f}
                      </li>
                    ))}
                    {plan.limitations.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground line-through">
                        <span className="text-gray-300 mt-0.5">✗</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/directorio/registrar?plan=${plan.id}`}>
                    <Button
                      className={`w-full ${plan.id === "profesional" ? "bg-blue-600 hover:bg-blue-700 text-white" : plan.id === "premium" ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-foreground"}`}
                    >
                      {plan.price === 0 ? "Registrar gratis" : "Comenzar ahora"}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
