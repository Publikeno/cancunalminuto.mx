import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2, Utensils, Hotel, Compass, Home, Scale,
  Stethoscope, GraduationCap, Wrench, CheckCircle, Crown, BadgeCheck, ArrowLeft
} from "lucide-react";

const CATEGORIES = [
  { id: "restaurantes", label: "Restaurantes", icon: Utensils },
  { id: "hoteles", label: "Hoteles", icon: Hotel },
  { id: "tours", label: "Tours", icon: Compass },
  { id: "inmobiliarias", label: "Inmobiliarias", icon: Home },
  { id: "abogados", label: "Abogados", icon: Scale },
  { id: "medicos", label: "Médicos", icon: Stethoscope },
  { id: "escuelas", label: "Escuelas", icon: GraduationCap },
  { id: "talleres", label: "Talleres", icon: Wrench },
] as const;

const PLAN_INFO = [
  {
    id: "basico", label: "Básico", price: 0, color: "border-gray-200",
    activeColor: "border-gray-500 bg-gray-50",
    icon: Building2, iconColor: "text-gray-500",
    features: ["Perfil básico", "Teléfono y dirección", "Formulario de contacto"],
  },
  {
    id: "profesional", label: "Profesional", price: 699, color: "border-blue-200",
    activeColor: "border-blue-500 bg-blue-50",
    icon: BadgeCheck, iconColor: "text-blue-600",
    badge: "Más popular",
    features: ["Logo + galería", "Horarios", "Redes sociales", "Insignia verificado"],
  },
  {
    id: "premium", label: "Premium", price: 1299, color: "border-amber-200",
    activeColor: "border-amber-500 bg-amber-50",
    icon: Crown, iconColor: "text-amber-600",
    badge: "Máxima visibilidad",
    features: ["Posición destacada", "Aparece en el mapa", "Banner en portada", "Estadísticas"],
  },
] as const;

export default function DirectorioRegistrar() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState<{ id: number; slug: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "" as any,
    plan: "basico" as "basico" | "profesional" | "premium",
    shortDescription: "",
    description: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    address: "",
    neighborhood: "",
    city: "Cancún",
    facebook: "",
    instagram: "",
  });

  const register = trpc.directory.register.useMutation({
    onSuccess: (res) => {
      setSuccess({ id: res.id, slug: res.slug });
      setStep(4);
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const canNext1 = form.name.trim().length >= 2 && form.category;
  const canNext2 = true; // contacto es opcional
  const canSubmit = canNext1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/directorio">
            <button className="flex items-center gap-2 text-red-200 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver al directorio
            </button>
          </Link>
          <h1 className="text-2xl font-bold">Registra tu negocio</h1>
          <p className="text-red-100 text-sm mt-1">Llega a miles de clientes en Cancún y la Riviera Maya</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Stepper */}
        {step < 4 && (
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step > s ? "bg-green-500 text-white" : step === s ? "bg-red-700 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {step > s ? "✓" : s}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${step === s ? "text-foreground" : "text-muted-foreground"}`}>
                  {s === 1 ? "Información" : s === 2 ? "Contacto" : "Plan"}
                </span>
                {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-green-500" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Paso 1: Información básica */}
        {step === 1 && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Información del negocio</h2>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Nombre del negocio *</label>
                <Input placeholder="Ej: Restaurante El Pescador" value={form.name} onChange={(e) => update("name", e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Categoría *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const active = form.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => update("category", cat.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${
                          active ? "border-red-500 bg-red-50 text-red-700" : "border-border hover:border-red-300 text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Descripción corta (máx. 300 caracteres)</label>
                <Input
                  placeholder="Ej: Mariscos frescos y ceviche en el corazón de Cancún"
                  value={form.shortDescription}
                  onChange={(e) => update("shortDescription", e.target.value.substring(0, 300))}
                />
                <p className="text-xs text-muted-foreground mt-1">{form.shortDescription.length}/300</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Descripción completa</label>
                <Textarea
                  placeholder="Cuéntanos más sobre tu negocio, especialidades, historia..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Colonia / Zona</label>
                <Input placeholder="Ej: Zona Hotelera, Centro, Puerto Juárez..." value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Dirección</label>
                <Input placeholder="Calle, número, colonia" value={form.address} onChange={(e) => update("address", e.target.value)} />
              </div>

              <Button
                className="w-full bg-red-700 hover:bg-red-800 text-white"
                disabled={!canNext1}
                onClick={() => setStep(2)}
              >
                Siguiente: Datos de contacto
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Paso 2: Contacto */}
        {step === 2 && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Datos de contacto</h2>
              <p className="text-sm text-muted-foreground">Todos los campos son opcionales, pero agrega los que uses para que tus clientes puedan contactarte.</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Teléfono</label>
                  <Input placeholder="998 123 4567" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">WhatsApp</label>
                  <Input placeholder="529981234567" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Email de contacto</label>
                <Input type="email" placeholder="contacto@minegocio.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Sitio web</label>
                <Input placeholder="https://www.minegocio.com" value={form.website} onChange={(e) => update("website", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Facebook</label>
                  <Input placeholder="https://facebook.com/..." value={form.facebook} onChange={(e) => update("facebook", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Instagram</label>
                  <Input placeholder="https://instagram.com/..." value={form.instagram} onChange={(e) => update("instagram", e.target.value)} />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Atrás</Button>
                <Button className="flex-1 bg-red-700 hover:bg-red-800 text-white" onClick={() => setStep(3)}>
                  Siguiente: Elegir plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 3: Plan */}
        {step === 3 && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Elige tu plan</h2>

              <div className="space-y-3">
                {PLAN_INFO.map((plan) => {
                  const Icon = plan.icon;
                  const active = form.plan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => update("plan", plan.id)}
                      className={`w-full text-left border-2 rounded-xl p-4 transition-all ${active ? plan.activeColor : plan.color + " hover:border-gray-300"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-white shadow-sm" : "bg-muted"}`}>
                          <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{plan.label}</span>
                            {"badge" in plan && plan.badge && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan.id === "profesional" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                                {plan.badge}
                              </span>
                            )}
                            <span className="ml-auto font-bold text-foreground">
                              {plan.price === 0 ? "Gratis" : `$${plan.price.toLocaleString()} MXN/mes`}
                            </span>
                          </div>
                          <ul className="mt-1 space-y-0.5">
                            {plan.features.map((f, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="text-green-500">✓</span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${active ? "border-red-600 bg-red-600" : "border-gray-300"}`}>
                          {active && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {form.plan !== "basico" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <strong>Nota:</strong> El pago del plan {form.plan} se coordinará con nuestro equipo después del registro. Tu negocio será revisado y activado en 24 horas hábiles.
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Atrás</Button>
                <Button
                  className="flex-1 bg-red-700 hover:bg-red-800 text-white"
                  disabled={register.isPending}
                  onClick={() => {
                    // Normalizar strings vacíos a undefined para campos opcionales
                    // (Zod rechaza "" en z.string().url() y z.string().email())
                    const payload = Object.fromEntries(
                      Object.entries(form).map(([k, v]) => [
                        k,
                        typeof v === "string" && v.trim() === "" ? undefined : v,
                      ])
                    ) as typeof form;
                    register.mutate(payload);
                  }}
                >
                  {register.isPending ? "Registrando..." : "Registrar negocio"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 4: Éxito */}
        {step === 4 && success && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">¡Negocio registrado!</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Tu negocio <strong>{form.name}</strong> fue registrado exitosamente y está en revisión.
                Nuestro equipo lo revisará en las próximas 24 horas hábiles.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/directorio">
                  <Button variant="outline">Ver directorio</Button>
                </Link>
                <Link href={`/directorio/${success.id}`}>
                  <Button className="bg-red-700 hover:bg-red-800 text-white">Ver mi perfil</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
