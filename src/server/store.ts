export type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  dataCriacao: string;
};

const g = globalThis as unknown as { __tarefasStore?: Map<string, Tarefa> };

function criarStore(): Map<string, Tarefa> {
  const agora = Date.now();
  const exemplos: Tarefa[] = [
    {
      id: crypto.randomUUID(),
      titulo: "Estudar tRPC",
      descricao: "Ler sobre procedures e routers.",
      dataCriacao: new Date(agora - 60_000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      titulo: "Revisar layout",
      descricao: null,
      dataCriacao: new Date(agora).toISOString(),
    },
  ];
  return new Map(exemplos.map((t) => [t.id, t]));
}

export const tarefas = (g.__tarefasStore ??= criarStore());
