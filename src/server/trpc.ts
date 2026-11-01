import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";

const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    // Por padrão o tRPC devolve o JSON bruto do Zod como mensagem.
    // Aqui o usuário recebe a primeira mensagem de validação, já em português.
    if (error.cause instanceof ZodError) {
      return {
        ...shape,
        message: error.cause.issues[0]?.message ?? "Dados inválidos.",
      };
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
