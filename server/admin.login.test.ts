import { describe, it, expect, beforeAll } from "vitest";

// Simula el comportamiento del endpoint admin.login sin necesidad de DB
describe("admin.login endpoint logic", () => {
  const ADMIN_PASSWORD = "test_password_123";

  // Helper que replica la lógica del endpoint
  function adminLogin(inputPassword: string, envPassword: string) {
    if (!envPassword || inputPassword !== envPassword) {
      throw new Error("Contraseña incorrecta");
    }
    const token = Buffer.from(`admin:${envPassword}:${Date.now()}`).toString("base64");
    return { token };
  }

  function verifyToken(token: string, envPassword: string) {
    if (!envPassword) return { valid: false };
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [prefix, pwd] = decoded.split(":");
      const valid = prefix === "admin" && pwd === envPassword;
      return { valid };
    } catch {
      return { valid: false };
    }
  }

  it("debe rechazar contraseña incorrecta", () => {
    expect(() => adminLogin("wrong_password", ADMIN_PASSWORD)).toThrow("Contraseña incorrecta");
  });

  it("debe rechazar cuando no hay contraseña configurada", () => {
    expect(() => adminLogin("cualquier_cosa", "")).toThrow("Contraseña incorrecta");
  });

  it("debe devolver un token válido con contraseña correcta", () => {
    const { token } = adminLogin(ADMIN_PASSWORD, ADMIN_PASSWORD);
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
  });

  it("el token generado debe verificarse correctamente", () => {
    const { token } = adminLogin(ADMIN_PASSWORD, ADMIN_PASSWORD);
    const { valid } = verifyToken(token, ADMIN_PASSWORD);
    expect(valid).toBe(true);
  });

  it("debe rechazar token inválido", () => {
    const { valid } = verifyToken("token_invalido_base64", ADMIN_PASSWORD);
    expect(valid).toBe(false);
  });

  it("debe rechazar token con contraseña diferente", () => {
    const { token } = adminLogin(ADMIN_PASSWORD, ADMIN_PASSWORD);
    // Simula que la contraseña cambió en el servidor
    const { valid } = verifyToken(token, "nueva_contraseña_diferente");
    expect(valid).toBe(false);
  });

  it("debe rechazar token vacío", () => {
    const { valid } = verifyToken("", ADMIN_PASSWORD);
    expect(valid).toBe(false);
  });
});
