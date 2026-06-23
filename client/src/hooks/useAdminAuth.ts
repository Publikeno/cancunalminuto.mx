import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export const ADMIN_TOKEN_KEY = "cam_admin_token";

export function useAdminAuth() {
  const [, navigate] = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) ?? "" : "";

  const { data, isLoading } = trpc.admin.verifyToken.useQuery(
    { token },
    {
      enabled: !!token,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );

  const isValid = !!token && !!data?.valid;

  useEffect(() => {
    if (!isLoading && !isValid) {
      // Token inválido o ausente → redirigir al login
      navigate("/admin/login");
    }
  }, [isLoading, isValid, navigate]);

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    navigate("/admin/login");
  };

  return { isAuthenticated: isValid, isLoading: isLoading || !token, logout };
}
