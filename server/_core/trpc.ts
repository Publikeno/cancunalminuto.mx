import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { ENV } from "./env";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // Aceptar autenticación por token de contraseña (header x-admin-token)
    const adminToken = ctx.req.headers["x-admin-token"] as string | undefined;
    if (adminToken && ENV.adminPassword) {
      try {
        const decoded = Buffer.from(adminToken, "base64").toString("utf-8");
        const [prefix, pwd] = decoded.split(":");
        if (prefix === "admin" && pwd === ENV.adminPassword) {
          return next({ ctx });
        }
      } catch {
        // token inválido, continuar con la verificación de rol
      }
    }

    // Fallback: verificación de rol OAuth (para compatibilidad)
    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
