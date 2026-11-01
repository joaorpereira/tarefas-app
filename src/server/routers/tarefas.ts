import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { TAMANHO_PAGINA } from "@/lib/paginacao";
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

// Mais recentes primeiro. O id desempata duas tarefas criadas no mesmo instante.
function compararTarefas(a: Tarefa, b: Tarefa) {
  const porData = b.dataCriacao.localeCompare(a.dataCriacao);
  if (porData !== 0) return porData;
  return b.id.localeCompare(a.id);
}

function cursorDe(tarefa: Tarefa) {
  return `${tarefa.dataCriacao}|${tarefa.id}`;
}

// O cursor é a última tarefa já vista. Se ela foi excluída, seguimos pela data,
// para a página seguinte não pular nem repetir o resto da lista.
function posicaoAposCursor(ordenadas: Tarefa[], cursor: string) {
  const exata = ordenadas.findIndex((tarefa) => cursorDe(tarefa) === cursor);
  if (exata !== -1) return exata + 1;

  const separador = cursor.indexOf("|");
  if (separador === -1) return ordenadas.length;
  const data = cursor.slice(0, separador);
  const id = cursor.slice(separador + 1);

  const proxima = ordenadas.findIndex((tarefa) => {
    const porData = tarefa.dataCriacao.localeCompare(data);
    if (porData !== 0) return porData < 0;
    return tarefa.id.localeCompare(id) < 0;
  });
  return proxima === -1 ? ordenadas.length : proxima;
}

function listarPagina(cursor: string | null | undefined, limit: number) {
  const ordenadas = Array.from(tarefas.values()).sort(compararTarefas);
  const inicio = cursor ? posicaoAposCursor(ordenadas, cursor) : 0;
  const items = ordenadas.slice(inicio, inicio + limit);
  const ultima = items[items.length - 1];
  const temMais = inicio + limit < ordenadas.length;
  return {
    items,
    nextCursor: temMais && ultima ? cursorDe(ultima) : null,
  };
}

export const tarefasRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(TAMANHO_PAGINA),
        cursor: z.string().min(1).nullish(),
      }),
    )
    .query(({ input }) => listarPagina(input.cursor, input.limit)),

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
