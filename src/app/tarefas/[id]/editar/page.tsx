"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { TaskForm } from "@/components/TaskForm";
import { useToast } from "@/components/Toast";

export default function EditarTarefaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const mostrar = useToast();

  const tarefa = trpc.tarefas.byId.useQuery({ id });

  const atualizar = trpc.tarefas.update.useMutation({
    onSuccess: async (atualizada) => {
      await utils.tarefas.list.invalidate();
      mostrar(`Alterações salvas em "${atualizada.titulo}".`);
      router.push("/tarefas");
    },
  });

  if (tarefa.isPending) {
    return <p className="text-stone-600">Carregando tarefa...</p>;
  }

  if (tarefa.error) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-red-700">
          {tarefa.error.message}
        </p>
        <Link href="/tarefas" className="text-teal-700 hover:underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Editar tarefa</h1>
      <TaskForm
        valoresIniciais={{
          titulo: tarefa.data.titulo,
          descricao: tarefa.data.descricao ?? "",
        }}
        textoBotao="Salvar alterações"
        enviando={atualizar.isPending}
        erro={atualizar.error?.message}
        onSubmit={(valores) => atualizar.mutate({ id, ...valores })}
      />
    </>
  );
}
