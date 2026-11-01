import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { TAMANHO_PAGINA } from "../src/lib/paginacao";

// Títulos com timestamp para o teste não colidir com dados de execuções anteriores.
const sufixo = Date.now();

test("cria, edita e exclui uma tarefa", async ({ page }) => {
  const titulo = `Tarefa de teste ${sufixo}`;

  await page.goto("/tarefas");
  await page.getByRole("link", { name: "Nova tarefa" }).click();

  await page.getByLabel("Título").fill(titulo);
  await page.getByLabel("Descrição").fill("Criada pelo teste automatizado.");
  await page.getByRole("button", { name: "Criar tarefa" }).click();

  await expect(page).toHaveURL("/tarefas");
  await expect(page.getByRole("status").filter({ hasText: "criada" })).toBeVisible();

  const item = page.getByRole("listitem").filter({ hasText: titulo });
  await expect(item).toBeVisible();

  await item.getByRole("link", { name: "Editar" }).click();
  await page.getByLabel("Título").fill(`${titulo} (editada)`);
  await page.getByRole("button", { name: "Salvar alterações" }).click();

  await expect(page).toHaveURL("/tarefas");
  await expect(page.getByRole("listitem").filter({ hasText: `${titulo} (editada)` })).toBeVisible();

  await page
    .getByRole("listitem")
    .filter({ hasText: `${titulo} (editada)` })
    .getByRole("link", { name: "Editar" })
    .click();
  await expect(page.getByLabel("Título")).toHaveValue(`${titulo} (editada)`);
  await page.getByRole("link", { name: "Cancelar" }).click();
  await expect(page).toHaveURL("/tarefas");

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("listitem")
    .filter({ hasText: `${titulo} (editada)` })
    .getByRole("button", { name: "Excluir" })
    .click();

  await expect(page.getByRole("status").filter({ hasText: "excluída" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: `${titulo} (editada)` })).toHaveCount(0);
});

test("não envia o formulário sem título", async ({ page }) => {
  await page.goto("/tarefas/nova");
  await page.getByRole("button", { name: "Criar tarefa" }).click();

  await expect(page.getByText("Informe um título para a tarefa.")).toBeVisible();
  await expect(page).toHaveURL("/tarefas/nova");
});

async function criarTarefa(request: APIRequestContext, titulo: string) {
  const resposta = await request.post("/api/trpc/tarefas.create?batch=1", {
    data: { "0": { titulo, descricao: "Página extra do teste." } },
  });
  const corpo = await resposta.json();
  return corpo[0].result.data.id as string;
}

async function excluirTarefa(request: APIRequestContext, id: string) {
  await request.post("/api/trpc/tarefas.delete?batch=1", {
    data: { "0": { id } },
  });
}

test("carrega a próxima página ao chegar no fim da lista", async ({ page, request }) => {
  const prefixo = `Scroll ${Date.now()}`;
  const ids: string[] = [];

  try {
    for (let i = 0; i < TAMANHO_PAGINA + 1; i += 1) {
      ids.push(await criarTarefa(request, `${prefixo} ${i}`));
    }

    const maisAntiga = `${prefixo} 0`;
    const segundaPagina = page.waitForRequest((req) => {
      const url = decodeURIComponent(req.url());
      return url.includes("/api/trpc/tarefas.list") && url.includes("cursor");
    });

    await page.goto("/tarefas");
    await chegarNoFim(page);
    await segundaPagina;
    await expect(page.getByRole("listitem").filter({ hasText: maisAntiga })).toBeVisible();
  } finally {
    await Promise.all(ids.map((id) => excluirTarefa(request, id)));
  }
});

async function chegarNoFim(page: Page) {
  const sentinel = page.locator("[data-sentinel]");
  if ((await sentinel.count()) === 0) return;
  await sentinel.scrollIntoViewIfNeeded();
}

test("mostra erro ao editar uma tarefa que não existe", async ({ page }) => {
  await page.goto("/tarefas/id-que-nao-existe/editar");

  await expect(page.getByRole("alert").filter({ hasText: "Tarefa não encontrada" })).toBeVisible();
});
