"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export type ValoresTarefa = { titulo: string; descricao: string };

type Props = {
  valoresIniciais?: ValoresTarefa;
  textoBotao: string;
  enviando: boolean;
  erro?: string | null;
  onSubmit: (valores: ValoresTarefa) => void;
};

const campo =
  "mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20";

export function TaskForm({
  valoresIniciais,
  textoBotao,
  enviando,
  erro,
  onSubmit,
}: Props) {
  const [titulo, setTitulo] = useState(valoresIniciais?.titulo ?? "");
  const [descricao, setDescricao] = useState(valoresIniciais?.descricao ?? "");
  const [tocado, setTocado] = useState(false);

  const tamanhoTitulo = titulo.trim().length;
  const erroTitulo =
    tamanhoTitulo === 0
      ? "Informe um título para a tarefa."
      : tamanhoTitulo > 120
        ? "O título deve ter até 120 caracteres."
        : null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTocado(true);
    if (erroTitulo || enviando) return;
    onSubmit({ titulo: titulo.trim(), descricao: descricao.trim() });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {erro && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      <div>
        <label htmlFor="titulo" className="block text-sm font-medium">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={() => setTocado(true)}
          aria-invalid={tocado && !!erroTitulo}
          aria-describedby={tocado && erroTitulo ? "titulo-erro" : undefined}
          className={campo}
          autoFocus
        />
        {tocado && erroTitulo && (
          <p id="titulo-erro" className="mt-1 text-sm text-red-700">
            {erroTitulo}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="descricao" className="block text-sm font-medium">
          Descrição <span className="font-normal text-stone-500">(opcional)</span>
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          maxLength={500}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className={campo}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {enviando ? "Salvando..." : textoBotao}
        </button>
        <Link href="/tarefas" className="text-sm text-stone-600 hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
