# Sistema de Controle de Estoque Profissional

Este projeto é um sistema de alta performance para gerenciamento de estoque, otimizado para peças automotivas ou industriais que utilizam códigos SKU.

## Funcionalidades Premium

- **Banco de Dados na Nuvem (Youbase)**: Seus dados agora estão salvos de forma permanente e segura na nuvem.
- **Alta Performance (Zero Lag)**: O sistema agora utiliza paginação inteligente e atualizações otimistas. Mesmo com milhares de itens, a interface permanece fluida e as ações são instantâneas.
- **Paginação Automática**: A lista de produtos carrega inicialmente 50 itens e permite carregar mais conforme necessário, evitando lentidão no navegador.
- **Ações Instantâneas**: Entradas, saídas e cadastros agora refletem no estoque imediatamente, sem esperar a resposta do servidor.
- **Importação Ultra-Flexível**: Agora você pode colar dados diretamente do Excel ou de uma lista simples. O sistema aceita:
  - Formato completo: `Código, Nome, Categoria, Qtd, Mínimo, Preço, Local`
  - Formato simplificado: `Código Nome` (separados por apenas um espaço)
  - Suporte a preços brasileiros: `1.234,56` ou `1234,56`
- **Inteligência de Cabeçalho**: O sistema ignora automaticamente a primeira linha se for um cabeçalho (ex: "SKU", "Código").
- **Busca Inteligente por Código (SKU)**: Localize peças instantaneamente digitando apenas o código ou parte do nome em qualquer tela do sistema.
- **Gestão de NFs com Descontos**: Módulo de entrada de Notas Fiscais que permite aplicar descontos por item ou no valor total da nota.
- **Importação de XML de NF-e**: Carregue o arquivo `.xml` da nota fiscal para entrada automática de produtos e atualização de estoque.
- **Leitor de Código de Barras**: Interface de scanner para dar saída em peças rapidamente usando a câmera do celular.
- **Impressão de Etiquetas**: Gere e imprima etiquetas com QR Code para identificar suas peças fisicamente.
- **Controle de Fornecedores**: Gerencie seus contatos de fornecedores e vincule-os às suas compras.
- **Dashboard de Relatórios**: Gráficos interativos de giro de estoque, distribuição por categoria e economia total.
- **Registro de Auditoria (Audit Trail)**: Histórico imutável de todas as movimentações (Entrada, Saída, Ajuste) com registro de placa de veículo e responsável.

## Como Usar as Novas Funções

1. **Etiquetas**: Vá na aba "Etiquet." para selecionar produtos e gerar etiquetas prontas para impressão.
2. **Fornecedores**: Use a aba "Fornec." para cadastrar as empresas de quem você compra.
3. **Scanner**: Clique em "Scanner" e aponte a câmera para o QR Code da etiqueta para registrar saídas.

## Tecnologias

- **Backend Youbase (Hono + Drizzle)**: Persistência de dados profissional.
- **React 18 + TypeScript**: Base sólida e tipada.
- **Zustand**: Estado global reativo sincronizado com o banco.
- **Tailwind CSS**: Estilização customizada de alta fidelidade.
- **Recharts**: Gráficos profissionais para análise de dados.

## Próximos Passos

- **Controle de Usuários**: Adicionar níveis de acesso (Admin, Operador).
- **Alertas por E-mail**: Notificar automaticamente quando o estoque estiver crítico.
- **Histórico de Preços**: Gráficos de variação de custo por fornecedor.
