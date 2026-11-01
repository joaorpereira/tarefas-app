import { test, expect } from "@playwright/test";

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
  await expect(page.getByText(`${titulo} (editada)`)).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("listitem")
    .filter({ hasText: `${titulo} (editada)` })
    .getByRole("button", { name: "Excluir" })
    .click();

  await expect(page.getByRole("status").filter({ hasText: "excluída" })).toBeVisible();
  await expect(page.getByText(`${titulo} (editada)`)).toHaveCount(0);
});

test("não envia o formulário sem título", async ({ page }) => {
  await page.goto("/tarefas/nova");
  await page.getByRole("button", { name: "Criar tarefa" }).click();

  await expect(page.getByText("Informe um título para a tarefa.")).toBeVisible();
  await expect(page).toHaveURL("/tarefas/nova");
});

test("mostra erro ao editar uma tarefa que não existe", async ({ page }) => {
  await page.goto("/tarefas/id-que-nao-existe/editar");

  await expect(page.getByRole("alert")).toContainText("Tarefa não encontrada");
});
