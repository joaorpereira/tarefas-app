"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { TAMANHO_PAGINA } from "@/lib/paginacao";
import { trpc } from "@/trpc/client";
import type { Tarefa } from "@/server/store";
import { useToast } from "@/components/Toast";

type PaginaInicial = {
  items: Tarefa[];
  nextCursor: string | null;
};

const consulta = { limit: TAMANHO_PAGINA };

export function TaskList({ initialPage }: { initialPage: PaginaInicial }) {
  const utils = trpc.useUtils();
  const snapshotServidor = useRef<PaginaInicial | null>(null);
  if (snapshotServidor.current !== initialPage) {
    snapshotServidor.current = initialPage;
    utils.tarefas.list.setInfiniteData(consulta, {
      pages: [initialPage],
      pageParams: [null],
    });
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = trpc.tarefas.list.useInfiniteQuery(consulta, {
    initialData: { pages: [initialPage], pageParams: [null] },
    getNextPageParam: (ultima) => ultima.nextCursor,
  });
  const mostrar = useToast();

  const excluir = trpc.tarefas.delete.useMutation({
    onSuccess: () => {
      mostrar("Tarefa excluída.");
      utils.tarefas.list.invalidate();
    },
    onError: (err) => {
      mostrar(err.message, "erro");
      utils.tarefas.list.invalidate();
    },
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const alvo = sentinelRef.current;
    if (!alvo || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage && !isFetchNextPageError) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(alvo);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage]);

  const vistas = new Set<string>();
  const tarefas: Tarefa[] = [];
  for (const pagina of data?.pages ?? [initialPage]) {
    for (const tarefa of pagina.items) {
      if (vistas.has(tarefa.id)) continue;
      vistas.add(tarefa.id);
      tarefas.push(tarefa);
    }
  }

  if (tarefas.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-stone-300 p-8 text-center text-stone-600">
        Nenhuma tarefa ainda. Crie a primeira.
      </p>
    );
  }

  return (
    <>
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

      <div ref={sentinelRef} data-sentinel="" className="h-px" aria-hidden="true" />

      {isFetchingNextPage && (
        <p role="status" className="py-4 text-center text-sm text-stone-500">
          Carregando mais tarefas...
        </p>
      )}

      {isFetchNextPageError && (
        <p role="alert" className="py-4 text-center text-sm text-red-700">
          Não foi possível carregar mais tarefas.{" "}
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            className="underline"
          >
            Tentar de novo
          </button>
        </p>
      )}
    </>
  );
}
