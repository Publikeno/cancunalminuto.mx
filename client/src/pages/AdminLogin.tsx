import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";

export const ADMIN_TOKEN_KEY = "cam_admin_token";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = trpc.admin.login.useMutation({
    onSuccess: ({ token }) => {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      toast.success("Acceso concedido");
      navigate("/dashboard");
    },
    onError: (e) => {
      toast.error(e.message ?? "Contraseña incorrecta");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    login.mutate({ password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-700 shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
          <p className="text-slate-400 text-sm mt-1">Cancún al Minuto</p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl"
        >
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-200 mb-2">
              <Lock className="w-4 h-4 inline mr-1.5 mb-0.5" />
              Contraseña de acceso
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/30 text-white placeholder:text-slate-400 pr-10 focus:border-red-400 focus:ring-red-400"
                autoFocus
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold h-11 text-base transition-all active:scale-[0.98]"
            disabled={!password.trim() || login.isPending}
          >
            {login.isPending ? "Verificando..." : "Entrar al panel"}
          </Button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Solo personal autorizado de Cancún al Minuto
        </p>
      </div>
    </div>
  );
}
