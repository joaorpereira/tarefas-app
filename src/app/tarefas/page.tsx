import Link from "next/link";
import { createCaller } from "@/server/caller";
import { TaskList } from "./TaskList";

// A lista vive em memória no servidor. Sem force-dynamic, o Next pré-renderizaria
// a página no build, com a store vazia, e mostraria dados desatualizados.
export const dynamic = "force-dynamic";

export default async function TarefasPage() {
  // SSR: a lista chega pronta no HTML, sem uma segunda requisição ao carregar.
  const api = createCaller({});
  const tarefas = await api.tarefas.list();

  return (
    <>
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tarefas</h1>
        <Link
          href="/tarefas/nova"
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Nova tarefa
        </Link>
      </header>
      <TaskList initialData={tarefas} />
    </>
  );
}
