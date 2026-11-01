"use client";

import Link from "next/link";
import { trpc } from "@/trpc/client";
import type { Tarefa } from "@/server/store";
import { useToast } from "@/components/Toast";

export function TaskList({ initialData }: { initialData: Tarefa[] }) {
  // initialData vem do SSR, então o primeiro render já tem as tarefas.
  const { data: tarefas } = trpc.tarefas.list.useQuery(undefined, { initialData });
  const utils = trpc.useUtils();
  const mostrar = useToast();

  const excluir = trpc.tarefas.delete.useMutation({
    onSuccess: () => {
      mostrar("Tarefa excluída.");
      utils.tarefas.list.invalidate();
    },
    onError: (err) => {
      mostrar(err.message, "erro");
      // Se a tarefa já tinha sumido, a lista na tela está desatualizada.
      utils.tarefas.list.invalidate();
    },
  });

  if (tarefas.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-stone-300 p-8 text-center text-stone-600">
        Nenhuma tarefa ainda. Crie a primeira.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 rounded-md border border-stone-200 bg-white">
      {tarefas.map((tarefa) => {
        const removendo = excluir.isPending && excluir.variables?.id === tarefa.id;
        return (
          <li key={tarefa.id} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="font-medium">{tarefa.titulo}</p>
              {tarefa.descricao && (
                <p className="mt-1 text-sm text-stone-600">{tarefa.descricao}</p>
              )}
              <time
                dateTime={tarefa.dataCriacao}
                suppressHydrationWarning
                className="mt-2 block text-xs text-stone-500"
              >
                Criada em {new Date(tarefa.dataCriacao).toLocaleString("pt-BR")}
              </time>
            </div>

            <div className="flex shrink-0 gap-3 text-sm">
              <Link
                href={`/tarefas/${tarefa.id}/editar`}
                className="text-teal-700 hover:underline"
              >
                Editar
              </Link>
              <button
                type="button"
                disabled={removendo}
                onClick={() => {
                  if (window.confirm(`Excluir a tarefa "${tarefa.titulo}"?`)) {
                    excluir.mutate({ id: tarefa.id });
                  }
                }}
                className="text-red-700 hover:underline disabled:opacity-50"
              >
                {removendo ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
