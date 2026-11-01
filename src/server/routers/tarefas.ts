import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { tarefas, type Tarefa } from "../store";

const TITULO_MAX = 120;
const DESCRICAO_MAX = 500;

const tituloSchema = z
  .string({ required_error: "Informe um título para a tarefa." })
  .trim()
  .min(1, "Informe um título para a tarefa.")
  .max(TITULO_MAX, `O título deve ter até ${TITULO_MAX} caracteres.`);

const descricaoSchema = z
  .string()
  .trim()
  .max(DESCRICAO_MAX, `A descrição deve ter até ${DESCRICAO_MAX} caracteres.`)
  .optional();

const idSchema = z.object({
  id: z.string().min(1, "Identificador inválido."),
});

// Centraliza o erro de "não encontrada" para list-by-id, update e delete.
function buscarOuFalhar(id: string): Tarefa {
  const tarefa = tarefas.get(id);
  if (!tarefa) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Tarefa não encontrada. Ela pode ter sido excluída.",
    });
  }
  return tarefa;
}

export const tarefasRouter = router({
  // Mais recentes primeiro. Como o dataCriacao é ISO, a ordenação por string funciona.
  list: publicProcedure.query(() =>
    Array.from(tarefas.values()).sort((a, b) =>
      b.dataCriacao.localeCompare(a.dataCriacao),
    ),
  ),

  byId: publicProcedure
    .input(idSchema)
    .query(({ input }) => buscarOuFalhar(input.id)),

  create: publicProcedure
    .input(z.object({ titulo: tituloSchema, descricao: descricaoSchema }))
    .mutation(({ input }) => {
      const tarefa: Tarefa = {
        id: crypto.randomUUID(),
        titulo: input.titulo,
        descricao: input.descricao || null,
        dataCriacao: new Date().toISOString(),
      };
      tarefas.set(tarefa.id, tarefa);
      return tarefa;
    }),

  update: publicProcedure
    .input(idSchema.extend({ titulo: tituloSchema, descricao: descricaoSchema }))
    .mutation(({ input }) => {
      const atual = buscarOuFalhar(input.id);
      // dataCriacao não muda na edição.
      const atualizada: Tarefa = {
        ...atual,
        titulo: input.titulo,
        descricao: input.descricao || null,
      };
      tarefas.set(atualizada.id, atualizada);
      return atualizada;
    }),

  delete: publicProcedure.input(idSchema).mutation(({ input }) => {
    buscarOuFalhar(input.id);
    tarefas.delete(input.id);
    return { id: input.id };
  }),
});
