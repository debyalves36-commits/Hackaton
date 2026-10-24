# Analise de Carreira · AC

Assistente comercial para vendedores de rota, criado para um hackathon de varejo. Reúne a carteira de clientes, o histórico de compras e oportunidades práticas de venda em uma interface que funciona no celular e no desktop.

**Perfil principal: Victoria Adorno, com exatamente 12 clientes fictícios.** Rafael Oliveira possui uma carteira independente de três clientes. O logo AC e as ilustrações dos produtos foram desenhados em SVG para este projeto, sem fotografias comerciais ou marcas externas.

## Site público e publicação

O endereço do repositório mostra o código. O site publicado usa o GitHub Pages em `https://debyalves36-commits.github.io/Hackaton/` após a ativação pelo administrador do repositório.

O projeto suporta as duas fontes do Pages: **GitHub Actions** ou a configuração existente **Deploy from a branch → main / (root)**. Na publicação por branch, `index.html`, `assets/`, `logo.svg`, `products/` e `.nojekyll` na raiz são saídas compiladas e versionadas. A branch `gh-pages` guarda uma cópia estática anterior e não é necessária para o fluxo atual.

O workflow `.github/workflows/pages.yml` identifica a fonte configurada, executa os testes e o build e publica a versão compilada. Para GitHub Actions, envia `dist/` pelas ações oficiais. Para `main / (root)`, atualiza os arquivos estáticos da raiz e solicita um build do Pages pela API. Depois verifica o endereço público, o JavaScript da versão atual, o logo e uma imagem de produto. Se necessário, execute-o manualmente em **Actions → Publicar site no GitHub Pages → Run workflow**.

O HTML de desenvolvimento fica em `src/index.template.html`. O Vite usa esse template ao executar ou compilar o projeto; a cópia compilada de `index.html` na raiz não interfere no desenvolvimento ou no HMR. Não edite os bundles gerados. Para atualizar manualmente a publicação por branch antes de enviar ao GitHub, execute `npm run build` e `npm run publish:static`. O segundo comando copia apenas as saídas do build, preservando o código-fonte e os arquivos de versões anteriores que ainda podem estar em cache.

Os caminhos do build, do logo e dos produtos são relativos para funcionar também dentro de `/Hackaton/`, sem arquivos ausentes na hospedagem.

## Executar

Requisitos: Node.js 22 ou superior e npm. Ambiente validado com Node 24.19.0.

```bash
npm install
npm run dev
```

O Vite utiliza a porta 5173 por padrão. Para instalar as versões exatas do arquivo de lock em outro ambiente, utilize `npm ci`.

```bash
npm run build       # TypeScript e build de produção em dist/
npm run preview     # Servir o build de produção
npm test            # Testes das regras comerciais
npm run test:e2e    # Fluxos no Chromium e responsividade
```

Os testes de navegador usam `/usr/bin/chromium` quando disponível. Em outras máquinas, instale o navegador com `npx playwright install chromium`, ou configure `PLAYWRIGHT_CHROMIUM_EXECUTABLE` com o caminho do Chromium local. O Playwright inicia o Vite automaticamente quando a porta 5173 está livre.

## Funcionalidades

- Login demonstrativo, sessão local e troca entre vendedores; os dados exibidos são filtrados pelo vendedor.
- Carteira com pesquisa por estabelecimento, bairro, cidade ou segmento, filtros comerciais, ordenação e exportação CSV.
- Análise individual com seleção de mês e ano, volume, IPC, recordes históricos, atingimento do bench e comparação anual.
- Gráficos de volume e IPC calculados diretamente dos pedidos; meses futuros não são apresentados como vendas realizadas.
- Catálogo com 15 produtos e ilustrações locais; quantidades mensais/anuais, última compra, comparação com o mês anterior, categorias e ordenação dos mais vendidos.
- Recomendações locais de recuperação de mix, produtos ainda não comprados, distância do bench e volume abaixo da média recente.
- Agendamento de visitas, prevenção de conflitos em uma janela de 30 minutos, check-in/check-out em tempo real, resultado, observações e duração calculada.
- Registro de pedidos com múltiplos SKUs, validação de quantidades inteiras, prevenção de linhas duplicadas, acompanhamento de entrega e cancelamento.
- Pós-venda com pedido relacionado opcional, tipo, descrição, acompanhamento e resolução; alertas no perfil do cliente.
- Desempenho geral, ranking por volume, IPC, crescimento ou distância do bench.
- Gamificação demonstrativa, histórico, níveis, conquistas e recompensas recalculadas.
- Persistência em localStorage, alerta em caso de armazenamento indisponível/corrompido e restauração da base pelo menu do perfil.

## Regras comerciais

As definições são centralizadas em `src/domain.ts`. Indicadores são derivados dos pedidos, nunca gravados como totais independentes.

| Indicador           | Definição no MVP                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pedido válido       | Qualquer pedido com status diferente de Cancelado. É contabilizado desde o registro comercial, sem duplicar caixas ao mudar a entrega.             |
| Volume              | Soma das caixas dos itens de pedidos válidos no período. Não representa faturamento financeiro.                                                    |
| IPC                 | Número de SKUs distintos em pedidos válidos do cliente no mês. Comprar o mesmo SKU duas vezes conta uma vez.                                       |
| Bench histórico     | Maior soma de caixas em um único mês de todo o histórico válido, independente do período selecionado. Em empates, exibe o primeiro mês do recorde. |
| Maior IPC           | Maior número mensal de SKUs distintos em todo o histórico válido, com o mês correspondente.                                                        |
| Atingimento         | Volume mensal / bench histórico × 100. Sem histórico, retorna zero e estado informativo.                                                           |
| Melhor mês do ano   | Maior volume mensal dentro do ano selecionado. É diferente do bench e do acumulado anual.                                                          |
| Acumulado anual     | Soma das caixas dos pedidos válidos do ano selecionado.                                                                                            |
| Variação mensal     | (volume atual − volume anterior) / volume anterior × 100. Sem base anterior, informa isso em vez de exibir infinito.                               |
| Positivação         | Cliente com ao menos um pedido válido no mês, contado uma única vez.                                                                               |
| Taxa de positivação | Clientes positivados / clientes da carteira × 100.                                                                                                 |
| IPC médio           | Soma do IPC de todos os clientes / tamanho da carteira, incluindo clientes sem compra com IPC zero.                                                |
| Atenção             | Clientes sem compra no período ou com redução mensal superior a 10%.                                                                               |

O histórico demonstrativo tem data-base **23 de outubro de 2026**, com compras determinísticas de 2025 e de janeiro a outubro de 2026. Não há vendas fictícias de novembro ou dezembro de 2026. Outubro é parcial; suas variações precisam ser contextualizadas. A comparação de 2026 e 2025 considera janeiro a outubro de ambos, sem confundir dez meses com doze. A seleção de 2025 mostra doze meses e deixa explícita a ausência de base de 2024.

Os dados incluem clientes em crescimento, clientes em queda, dois clientes da carteira principal sem compra recente, redução do mix, um recorde mensal em outubro, entregas pendentes, ocorrência de pós-venda e visitas realizadas/agendadas. O catálogo não representa estoque disponível ou recomendação de preço. As oportunidades são hipóteses para uma conversa com o cliente, sem previsão garantida.

Novos pedidos usam a data real do navegador. O seletor acompanha esse mês no cenário de demonstração de outubro de 2026; a base e os seletores anuais são limitados a 2025/2026. Para usar o protótipo em outro ano, atualize o calendário demonstrativo em uma tarefa de desenvolvimento.

## Gamificação

Não foi encontrado um sistema de gamificação anterior no workspace. O módulo demonstrativo está desacoplado nas funções de domínio. A integração com o sistema anterior depende do acesso ao código correspondente.

| Ação                                                     |  XP |
| -------------------------------------------------------- | --: |
| Consultar análise de um cliente pela primeira vez no dia |   1 |
| Concluir visita iniciada no sistema                      |   2 |
| Acompanhar ou resolver ocorrência                        |   2 |
| Registrar pedido válido                                  |   3 |
| Ampliar IPC com um pedido entregue                       |   4 |
| Superar bench existente com pedido válido                |   5 |

A consulta utiliza a chave vendedor + cliente + data local. Visitas e ocorrências usam identificadores únicos. Acompanhar e depois resolver a mesma ocorrência não duplica a recompensa. Pedidos têm XP derivado do histórico válido: mudar status ou recarregar não acumula eventos; cancelar exclui suas recompensas e recalcula as subsequentes. A origem de um novo bench/IPC segue a ordem cronológica dos pedidos. Não há recompensa de criação de dados históricos iniciais. Os níveis avançam a cada 50 XP; conquistas destacam análise, visita e primeira venda. Estas regras são locais, não resistentes à manipulação do navegador.

## Arquitetura e identidade

React + TypeScript + Vite, Lucide React para ícones e Recharts para gráficos. Os modelos ficam em `src/types.ts`, a base fictícia em `src/data.ts`, os cálculos em `src/domain.ts` e o armazenamento em `src/storage.ts`. A navegação usa o fragmento da URL para funcionar em hospedagem estática sem configuração de rotas no servidor.

A identidade utiliza as cores do briefing: lavanda `#C1D0F5`, azul claro `#68B1D7`, azul petróleo `#237899`, verde água `#A0D6D4` e verde-limão `#B1E023`. Os tokens são definidos em `src/styles.css`. As fontes DM Sans e Manrope são distribuídas localmente via @fontsource. Logo, imagens e fontes não dependem de chamadas externas durante a navegação.

## Roteiro de apresentação

1. Acesse como **Victoria Adorno** e mostre os 12 clientes.
2. Busque **Mercado Vila Esperança** e abra sua análise.
3. Apresente volume, bench, distância do recorde e os gráficos; mude o mês e observe que o bench histórico permanece consistente.
4. Em **Produtos e mix**, consulte quantidades, categorias, itens ausentes e a evolução do IPC.
5. Em **Oportunidades**, use a sugestão baseada no histórico para planejar a abordagem.
6. Na aba **Operação**, inicie uma visita, consulte a análise, registre as observações e finalize. A duração usa os horários reais.
7. Registre um pedido com um produto novo, como Quibe congelado; mostre a atualização dos indicadores.
8. Confirme a entrega e consulte o desempenho/XP. Cancele o pedido para demonstrar o recálculo sem duplicação.
9. Abra **Supermercado Bela Vista** para mostrar um bench alcançado no mês da demonstração.
10. Troque para **Rafael Oliveira** para demonstrar outra carteira. Restaure a base fictícia pelo menu do perfil quando desejar reiniciar a apresentação.

## Validação

Testes de domínio cobrem caixas, deduplicação de SKUs, cancelamentos, bench, maior IPC, base vazia, positivação, mix, consistência dos dados e reversão de XP. Os testes Playwright cobrem login, isolamento de carteiras, busca/filtros, análise, imagens, registro e entrega de pedido, pós-venda, visita com duração real, persistência/restauração, CSV, agendamento e conflitos, dados corrompidos e ausência de rolagem horizontal em 375, 430, 768 e 1366 px.

## Limitações e privacidade

Este é um protótipo acadêmico. Login não é autenticação segura; o isolamento é apenas de interface, e todos os dados estão no mesmo armazenamento do navegador. Não use dados pessoais reais ou credenciais. Compras, entregas e visitas históricas são simuladas. Não existe integração real com Minutinho de Ouro, ERP, transportadoras, IA generativa, banco externo ou servidor de autenticação. Não há sincronização entre dispositivos nem recuperação remota. Apagar os dados do navegador remove as alterações; a restauração afeta todos os perfis.

A exportação CSV contempla os clientes atualmente visíveis e o mês selecionado. Os filtros de pedidos mostram o histórico completo, com cliente e situação, enquanto os indicadores obedecem ao mês selecionado. O protótipo permite criar/cancelar pedidos, mas não editar itens já registrados; cancele e registre outro pedido se necessário.
