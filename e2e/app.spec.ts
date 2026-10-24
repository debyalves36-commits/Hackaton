import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, seller = "victoria") {
  await page.goto("/");
  await page.selectOption("#seller", seller);
  await page.getByRole("button", { name: "Entrar na minha carteira" }).click();
  await expect(page.locator(".client-card")).toHaveCount(
    seller === "victoria" ? 12 : 3,
  );
}
async function openFirst(page: Page) {
  await page
    .locator(".client-card")
    .filter({
      has: page.getByRole("heading", {
        name: "Mercado Vila Esperança",
        exact: true,
      }),
    })
    .getByRole("button", { name: "Ver análise" })
    .click();
}
test("login, isolamento, pesquisa, filtros, análise, produtos, persistência e restauração", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  await expect(page.locator(".page-heading")).toContainText("Olá, Victoria");
  await page.getByRole("button", { name: "Sem compra", exact: true }).click();
  await expect(page.locator(".client-card")).toHaveCount(2);
  await page.getByRole("button", { name: /^Todos/ }).click();
  await expect(page.locator(".client-card")).toHaveCount(12);
  await page
    .getByRole("textbox", { name: "Buscar clientes" })
    .fill("Mercado Vila Esperança");
  await expect(page.locator(".client-card")).toHaveCount(1);
  await openFirst(page);
  await expect(page.locator(".client-title")).toContainText(
    "Mercado Vila Esperança",
  );
  await expect(page.locator(".metric-value").nth(2)).not.toHaveText("0caixas");
  const bench = await page.locator(".metric-value").nth(2).innerText();
  await page.selectOption("#month", "09");
  await expect(page.locator(".metric-value").nth(2)).toHaveText(bench);
  await page.getByRole("tab", { name: "Produtos e mix" }).click();
  await expect(page.locator(".product-card")).toHaveCount(15);
  await expect(page.locator(".product-image img").first()).toBeVisible();
  expect(
    await page
      .locator(".product-image img")
      .first()
      .evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
  await page.getByLabel("Categoria de produtos").selectOption("Frango");
  await expect(page.locator(".product-card")).toHaveCount(3);
  await page.getByRole("tab", { name: "Oportunidades" }).click();
  await expect(page.locator(".opportunity").first()).toBeVisible();
  await page.getByLabel("Menu do perfil").click();
  await page
    .getByRole("button", { name: "Trocar de perfil", exact: true })
    .click();
  await page.selectOption("#seller", "rafael");
  await page.getByRole("button", { name: "Entrar na minha carteira" }).click();
  await expect(page.locator(".client-card")).toHaveCount(3);
  await expect(page.locator(".page-heading")).toContainText("Olá, Rafael");
  await page.reload();
  await expect(page.locator(".client-card")).toHaveCount(3);
  await page.getByLabel("Menu do perfil").click();
  await page
    .getByRole("button", { name: "Restaurar dados", exact: true })
    .click();
  await page.getByRole("button", { name: "Restaurar dados fictícios" }).click();
  await expect(page.locator(".client-card")).toHaveCount(3);
  expect(errors).toEqual([]);
});
test("pedido atualiza métricas, entrega, ocorrência e cancelamento recalculam indicadores", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-23T15:00:00Z") });
  await login(page);
  await openFirst(page);
  const original = await page.locator(".metric-value").first().innerText();
  await page.getByRole("button", { name: "Novo pedido", exact: true }).click();
  await page.getByLabel("Produto 1", { exact: true }).selectOption("p15");
  await page.getByLabel("Caixas 1", { exact: true }).fill("25");
  await page
    .getByRole("button", { name: "Registrar pedido", exact: false })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".metric-value").first()).not.toHaveText(original);
  await page.reload();
  await expect(page.locator(".metric-value").first()).not.toHaveText(original);
  await page.getByRole("tab", { name: "Operação" }).click();
  await page.locator(".order-card").first().locator(".order-summary").click();
  await page.getByRole("button", { name: "Confirmar entrega" }).click();
  await expect(page.locator(".order-card").first()).toContainText("Entregue");
  await page
    .locator(".order-card")
    .first()
    .getByRole("button", { name: "Registrar ocorrência" })
    .click();
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Entrega demonstrativa com divergência de quantidade.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Registrar ocorrência", exact: true })
    .click();
  await expect(page.locator(".issue-card")).toHaveCount(1);
  await page
    .locator(".issue-card")
    .getByLabel("Status ocorrência", { exact: false })
    .selectOption("Resolvido");
  await page
    .locator(".issue-card")
    .getByLabel("Resolução / acompanhamento")
    .fill("Quantidade conferida e reposição concluída.");
  await page
    .locator(".issue-card")
    .getByRole("button", { name: "Salvar", exact: true })
    .click();
  await expect(page.locator(".issue-card .badge")).toHaveText("Resolvido");
  await page
    .locator(".order-card")
    .first()
    .locator(".order-actions select")
    .selectOption("Cancelado");
  await expect(page.locator(".metric-value").first()).toHaveText(original);
});
test("visita tem check-in, duração real e conclusão persistida; XP de consulta não duplica", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-23T15:00:00Z") });
  await login(page);
  await openFirst(page);
  await page.getByRole("tab", { name: "Operação" }).click();
  await page
    .getByRole("button", { name: "Iniciar visita", exact: true })
    .click();
  await expect(page.locator(".active-visit")).toBeVisible();
  await page.clock.fastForward(120000);
  await page
    .locator(".active-visit textarea")
    .fill("Mix apresentado durante a visita de demonstração.");
  await page.getByRole("button", { name: "Finalizar visita" }).click();
  await expect(page.locator(".visit-list")).toContainText("Duração: 2 min");
  await page.reload();
  await page.getByRole("tab", { name: "Operação" }).click();
  await expect(page.locator(".visit-list")).toContainText("Mix apresentado");
  await page.getByRole("button", { name: "Voltar à carteira" }).click();
  await openFirst(page);
  const storage = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ac-data-v1")!),
  );
  expect(
    storage.events.filter((e: any) => e.type === "Análise de cliente"),
  ).toHaveLength(1);
});
for (const width of [375, 430, 768, 1366])
  test(`interface sem overflow e navegação em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/carteira-${width}.png`,
      fullPage: true,
    });
    await openFirst(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("tab", { name: "Produtos e mix" }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 701) {
      await page
        .locator(".bottom-nav")
        .getByRole("button", { name: "Desempenho" })
        .click();
      await expect(page.locator(".page-heading h1")).toHaveText(
        "Desempenho comercial",
      );
    } else {
      await page
        .locator(".sidebar nav")
        .getByRole("button", { name: "Desempenho" })
        .click();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
test("exportação CSV e agendamento validam horário e conflitos", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-23T15:00:00Z") });
  await login(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("carteira-2026-10.csv");
  await page
    .locator(".sidebar nav")
    .getByRole("button", { name: "Visitas", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Agendar visita", exact: true })
    .click();
  await page.getByLabel("Data e horário").fill("2026-10-27T10:00");
  await page
    .getByLabel("Observações", { exact: true })
    .fill("Apresentar novo catálogo de congelados.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Agendar visita", exact: true })
    .click();
  await expect(page.locator(".visit-list")).toContainText(
    "Apresentar novo catálogo",
  );
  await page
    .getByRole("button", { name: "Agendar visita", exact: true })
    .click();
  await page.getByLabel("Data e horário").fill("2026-10-27T10:15");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Agendar visita", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Já existe uma visita");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
});
test("armazenamento corrompido mostra recuperação e restauração volta a persistir", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("ac-data-v1", "{invalid"));
  await page.reload();
  await page.getByRole("button", { name: "Entrar na minha carteira" }).click();
  await expect(page.getByRole("alert")).toContainText("não puderam ser lidos");
  await expect(page.locator(".client-card")).toHaveCount(12);
  await page.getByLabel("Menu do perfil").click();
  await page
    .getByRole("button", { name: "Restaurar dados", exact: true })
    .click();
  await page.getByRole("button", { name: "Restaurar dados fictícios" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await openFirst(page);
  await page.reload();
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ac-data-v1")!),
  );
  expect(data.events).toHaveLength(1);
});
