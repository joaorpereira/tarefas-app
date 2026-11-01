"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Tipo = "sucesso" | "erro";
type Aviso = { id: number; mensagem: string; tipo: Tipo };
type Mostrar = (mensagem: string, tipo?: Tipo) => void;

const ToastContext = createContext<Mostrar | null>(null);
const DURACAO_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const mostrar = useCallback<Mostrar>((mensagem, tipo = "sucesso") => {
    const id = Date.now() + Math.random();
    setAvisos((atuais) => [...atuais, { id, mensagem, tipo }]);
    setTimeout(() => {
      setAvisos((atuais) => atuais.filter((a) => a.id !== id));
    }, DURACAO_MS);
  }, []);

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 flex w-80 flex-col gap-2">
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            role={aviso.tipo === "erro" ? "alert" : "status"}
            className={`pointer-events-auto rounded-md px-4 py-3 text-sm shadow-md ${
              aviso.tipo === "erro"
                ? "bg-red-600 text-white"
                : "bg-stone-900 text-stone-50"
            }`}
          >
            {aviso.mensagem}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): Mostrar {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de ToastProvider");
  return ctx;
}
