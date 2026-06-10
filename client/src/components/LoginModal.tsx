import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onLogin: () => void;
  correctCode: string;
}

export default function LoginModal({ isOpen, onLogin, correctCode }: LoginModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === correctCode) {
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
}
