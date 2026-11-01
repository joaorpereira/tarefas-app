import { createCallerFactory } from "./trpc";
import { appRouter } from "./root";

// Chamada direta às procedures, sem HTTP. Usada nas páginas server-side (SSR).
export const createCaller = createCallerFactory(appRouter);
