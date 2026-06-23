import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  MapPin, Phone, Globe, Star, ArrowLeft, Building2, Utensils,
  Hotel, Compass, Home, Scale, Stethoscope, GraduationCap,
  Wrench, Crown, BadgeCheck, MessageCircle, Eye, Clock,
  Facebook, Instagram, Mail, ExternalLink, Share2
} from "lucide-react";

const CAT_ICONS: Record<string, any> = {
  restaurantes: Utensils, hoteles: Hotel, tours: Compass,
  inmobiliarias: Home, abogados: Scale, medicos: Stethoscope,
  escuelas: GraduationCap, talleres: Wrench,
};

const CAT_COLORS: Record<string, string> = {
  restaurantes: "bg-orange-100 text-orange-700",
  hoteles: "bg-blue-100 text-blue-700",
  tours: "bg-green-100 text-green-700",
  inmobiliarias: "bg-purple-100 text-purple-700",
  abogados: "bg-indigo-100 text-indigo-700",
  medicos: "bg-red-100 text-red-700",
  escuelas: "bg-yellow-100 text-yellow-700",
  talleres: "bg-slate-100 text-slate-700",
};

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-6 h-6 cursor-pointer transition-colors ${
            i <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-gray-300"
          }`}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm text-foreground">{review.authorName}</p>
          <StarRating value={review.rating} />
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(review.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </div>
      {review.title && <p className="font-medium text-sm mt-2 text-foreground">{review.title}</p>}
      {review.body && <p className="text-sm text-muted-foreground mt-1">{review.body}</p>}
    </div>
  );
}

export default function DirectorioDetalle() {
  const { id } = useParams<{ id: string }>();
  const numId = parseInt(id ?? "0");
  const { data, isLoading, refetch } = trpc.directory.getById.useQuery({ id: numId }, { enabled: !!numId });
  const trackView = trpc.directory.trackView.useMutation();

  // Track view on mount
  useState(() => {
    if (numId) trackView.mutate({ id: numId });
  });

  // Formulario de contacto
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const sendContact = trpc.directory.sendContact.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      setContactForm({ name: "", email: "", phone: "", message: "" });
    },
    onError: () => toast.error("No se pudo enviar el mensaje"),
  });

  // Formulario de reseña
  const [reviewForm, setReviewForm] = useState({ name: "", email: "", rating: 0, title: "", body: "" });
  const submitReview = trpc.directory.submitReview.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      setReviewForm({ name: "", email: "", rating: 0, title: "", body: "" });
      refetch();
    },
    onError: () => toast.error("No se pudo enviar la reseña"),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-64 bg-muted rounded-xl animate-pulse mb-6" />
        <div className="h-8 bg-muted rounded w-1/2 mb-4 animate-pulse" />
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground">Negocio no encontrado</h2>
        <Link href="/directorio">
          <Button className="mt-4" variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Volver al directorio</Button>
        </Link>
      </div>
    );
  }

  const { listing, reviews, avgRating } = data;
  const Icon = CAT_ICONS[listing.category] ?? Building2;
  const catColor = CAT_COLORS[listing.category] ?? "bg-gray-100 text-gray-700";
  const photos: string[] = listing.photos ? JSON.parse(listing.photos) : [];
  const schedule: Record<string, string> = listing.schedule ? JSON.parse(listing.schedule) : {};
  const days: Record<string, string> = {
    lunes: "Lunes", martes: "Martes", miercoles: "Miércoles",
    jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-muted/50 border-b border-border px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Inicio</Link>
          <span>/</span>
          <Link href="/directorio" className="hover:text-foreground">Directorio</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{listing.name}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover + Logo */}
          <div className="relative rounded-xl overflow-hidden">
            <div className="h-52 bg-gradient-to-br from-slate-200 to-slate-300">
              {listing.coverUrl ? (
                <img src={listing.coverUrl} alt={listing.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="w-20 h-20 text-slate-300" />
                </div>
              )}
            </div>
            {listing.logoUrl && (
              <div className="absolute bottom-0 left-4 translate-y-1/2">
                <img src={listing.logoUrl} alt="" className="w-16 h-16 rounded-xl border-4 border-background object-cover shadow-lg" />
              </div>
            )}
          </div>

          {/* Nombre y badges */}
          <div className={listing.logoUrl ? "pt-8" : ""}>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{listing.name}</h1>
              {listing.verified && (
                <BadgeCheck className="w-6 h-6 text-blue-500" />
              )}
              {listing.plan === "premium" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  <Crown className="w-3 h-3" /> Premium
                </span>
              )}
              {listing.plan === "profesional" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                  <BadgeCheck className="w-3 h-3" /> Profesional
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${catColor}`}>
                <Icon className="w-3 h-3" />
                {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
              </span>
              {avgRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-foreground">{avgRating}</span>
                  <span className="text-xs text-muted-foreground">({reviews.length} reseñas)</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.viewCount} visitas</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{listing.contactCount} contactos</span>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {listing.description && (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-foreground mb-2">Acerca de</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{listing.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Galería */}
          {photos.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-foreground mb-3">Galería</h2>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, i) => (
                    <img key={i} src={url} alt={`Foto ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mapa */}
          {listing.lat && listing.lng && (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" /> Ubicación
                </h2>
                {listing.address && <p className="text-sm text-muted-foreground mb-3">{listing.address}</p>}
                <div className="rounded-lg overflow-hidden" style={{ height: 240 }}>
                  <MapView
                    initialCenter={{ lat: parseFloat(listing.lat), lng: parseFloat(listing.lng) }}
                    initialZoom={15}
                    onMapReady={(map) => {
                      new google.maps.Marker({
                        position: { lat: parseFloat(listing.lat!), lng: parseFloat(listing.lng!) },
                        map,
                        title: listing.name,
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reseñas */}
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Reseñas {reviews.length > 0 && <span className="text-muted-foreground font-normal text-sm">({reviews.length})</span>}
              </h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay reseñas. ¡Sé el primero!</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {reviews.map((r: any) => <ReviewCard key={r.id} review={r} />)}
                </div>
              )}

              {/* Formulario de reseña */}
              <div className="border-t border-border pt-4 mt-4">
                <h3 className="font-medium text-foreground mb-3">Escribe una reseña</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Calificación *</p>
                    <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Tu nombre *" value={reviewForm.name} onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))} />
                    <Input placeholder="Tu email (opcional)" type="email" value={reviewForm.email} onChange={(e) => setReviewForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <Input placeholder="Título de la reseña (opcional)" value={reviewForm.title} onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))} />
                  <Textarea placeholder="Cuéntanos tu experiencia (mínimo 10 caracteres) *" rows={3} value={reviewForm.body} onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))} />
                  <Button
                    className="bg-red-700 hover:bg-red-800 text-white"
                    disabled={!reviewForm.name || reviewForm.rating === 0 || submitReview.isPending}
                    onClick={() =>
                      submitReview.mutate({
                        listingId: numId,
                        authorName: reviewForm.name,
                        authorEmail: reviewForm.email || undefined,
                        rating: reviewForm.rating,
                        title: reviewForm.title || undefined,
                        body: reviewForm.body || undefined,
                      })
                    }
                  >
                    {submitReview.isPending ? "Enviando..." : "Enviar reseña"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Contacto rápido */}
          <Card className="sticky top-4">
            <CardContent className="p-5 space-y-3">
              <h2 className="font-semibold text-foreground">Contactar</h2>

              {listing.whatsapp && (
                <a
                  href={`https://wa.me/${listing.whatsapp.replace(/\D/g, "")}?text=Hola, vi su negocio en CancúnalMinuto y me interesa más información.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-3 font-medium text-sm transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
              )}

              {listing.phone && (
                <a
                  href={`tel:${listing.phone}`}
                  className="flex items-center gap-3 w-full border border-border rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted transition-colors text-foreground"
                >
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {listing.phone}
                </a>
              )}

              {listing.website && (
                <a
                  href={listing.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full border border-border rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted transition-colors text-foreground"
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  Sitio web
                  <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                </a>
              )}

              {listing.email && (
                <a
                  href={`mailto:${listing.email}`}
                  className="flex items-center gap-3 w-full border border-border rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted transition-colors text-foreground"
                >
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {listing.email}
                </a>
              )}

              {/* Redes sociales */}
              {(listing.facebook || listing.instagram) && (
                <div className="flex gap-2 pt-1">
                  {listing.facebook && (
                    <a href={listing.facebook} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 border border-border rounded-lg py-2 text-sm hover:bg-muted transition-colors text-foreground">
                      <Facebook className="w-4 h-4 text-blue-600" /> Facebook
                    </a>
                  )}
                  {listing.instagram && (
                    <a href={listing.instagram} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 border border-border rounded-lg py-2 text-sm hover:bg-muted transition-colors text-foreground">
                      <Instagram className="w-4 h-4 text-pink-600" /> Instagram
                    </a>
                  )}
                </div>
              )}

              {/* Formulario de mensaje */}
              <div className="border-t border-border pt-3 mt-1">
                <p className="text-sm font-medium text-foreground mb-2">Enviar mensaje</p>
                <div className="space-y-2">
                  <Input placeholder="Tu nombre *" value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))} className="text-sm" />
                  <Input placeholder="Tu email *" type="email" value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} className="text-sm" />
                  <Input placeholder="Tu teléfono (opcional)" value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} className="text-sm" />
                  <Textarea placeholder="Tu mensaje *" rows={3} value={contactForm.message} onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))} className="text-sm" />
                  <Button
                    className="w-full bg-red-700 hover:bg-red-800 text-white text-sm"
                    disabled={!contactForm.name || !contactForm.email || !contactForm.message || sendContact.isPending}
                    onClick={() =>
                      sendContact.mutate({
                        listingId: numId,
                        senderName: contactForm.name,
                        senderEmail: contactForm.email,
                        senderPhone: contactForm.phone || undefined,
                        message: contactForm.message,
                      })
                    }
                  >
                    {sendContact.isPending ? "Enviando..." : "Enviar mensaje"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horarios */}
          {Object.keys(schedule).length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" /> Horarios
                </h2>
                <div className="space-y-1.5">
                  {Object.entries(days).map(([key, label]) =>
                    schedule[key] ? (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium text-foreground">{schedule[key]}</span>
                      </div>
                    ) : null
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dirección */}
          {listing.address && (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" /> Dirección
                </h2>
                <p className="text-sm text-muted-foreground">{listing.address}</p>
                {listing.neighborhood && (
                  <p className="text-sm text-muted-foreground">{listing.neighborhood}, {listing.city}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compartir */}
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Compartir
              </h2>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/?text=Mira este negocio en CancúnalMinuto: ${listing.name} ${window.location.href}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 text-xs font-medium transition-colors"
                >
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-xs font-medium transition-colors"
                >
                  <Facebook className="w-3 h-3" /> Facebook
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
