"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { TaskForm } from "@/components/TaskForm";
import { useToast } from "@/components/Toast";

export default function NovaTarefaPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const mostrar = useToast();

  const criar = trpc.tarefas.create.useMutation({
    onSuccess: async (tarefa) => {
      await utils.tarefas.list.invalidate();
      mostrar(`Tarefa "${tarefa.titulo}" criada.`);
      router.push("/tarefas");
    },
  });

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Nova tarefa</h1>
      <TaskForm
        textoBotao="Criar tarefa"
        enviando={criar.isPending}
        erro={criar.error?.message}
        onSubmit={(valores) => criar.mutate(valores)}
      />
    </>
  );
}
