# greencode

API REST para gestão de logística reversa de resíduos eletrônicos (AV2).
Na AV1 o greencode era uma CLI que salvava em arquivos criptografados; agora é um
servidor HTTP com Express, Prisma ORM e MySQL, com login por token JWT.

## O que precisa ter instalado

- Node.js 22.9 ou mais novo
- MySQL 8 rodando na máquina (porta 3306)
- Insomnia, para testar as rotas (opcional, mas o roteiro abaixo usa ele)

Funciona no Windows 10+ e no Ubuntu 24.04.

## Como rodar

1. Copie o arquivo de exemplo de variáveis de ambiente:

   ```
   copy .env.example .env      (Windows)
   cp .env.example .env        (Ubuntu)
   ```

2. Abra o `.env` e troque `SUA_SENHA` pela senha do root do seu MySQL.
   O banco `greencode` é criado sozinho, não precisa criar antes.

3. Rode:

   ```
   npm run dev
   ```

   Esse comando instala as dependências, gera o Prisma Client, compila,
   **apaga e recria o banco `greencode`** (aplicando as migrations e o seed com
   dados de exemplo) e sobe o servidor. Quando aparecer
   `greencode rodando na porta 3000` está pronto.

Para parar o servidor, use Ctrl+C. Para subir de novo **sem** apagar os dados,
use `npm run iniciar`.

## Usuários criados pelo seed

| Login | Senha | Papel | O que pode fazer |
|---|---|---|---|
| admin | admin123 | ADMINISTRADOR | tudo, inclusive usuários e parâmetros |
| operador | operador123 | OPERADOR_CADASTRO | cadastrar organizações e contratos |
| gestor | gestor123 | GESTOR_ALMOXARIFADO | lotes, equipamentos, triagem e status |
| auditor | auditor123 | AUDITOR | só consultar e gerar relatórios |

Todos os papéis podem fazer consultas (`GET`).

## Dados de exemplo

| Código | Equipamento | Organização | Status | Estado |
|---|---|---|---|---|
| GC-COMP-0001 | Dell Optiplex 3080 | 1 - Comercial Alfa | RECEBIDO | - |
| GC-COMP-0002 | Lenovo ThinkCentre M70 | 1 - Comercial Alfa | TRIADO | BOM |
| GC-MON-0001 | Samsung S22F350 | 1 - Comercial Alfa | DESMONTE | REGULAR |
| GC-PER-0001 | Logitech Teclado K120 | 1 - Comercial Alfa | DESCARTADO | SUCATA |
| GC-COMP-0003 | HP ProDesk 400 | 2 - Hospital Beta | RECICLADO | RUIM |
| GC-MON-0002 | LG Flatron CRT | 2 - Hospital Beta | RECEBIDO | - |

A organização 1 tem contrato; a 2 não tem. O lote 2 entrou há 75 dias, então os
equipamentos dele já mostram depreciação no rastreio.

## Como testar com o Insomnia

1. Rode `npm run dev` (banco limpo).
2. No Insomnia: **Import** → **From File** → escolha o arquivo `insomnia.json` da raiz do projeto.
3. Vai aparecer a coleção **greencode** com 7 pastas. Basta clicar em **Send** em
   cada requisição, de cima para baixo. O login é feito sozinho: cada requisição
   já usa o token do papel certo.

O nome de cada requisição diz o resultado esperado quando é um erro, por exemplo
`Criar com CNPJ invalido (400)`. O que cada pasta mostra:

1. **Autenticacao**: login de cada papel e senha errada (401).
2. **Usuarios**: só o admin gerencia contas; o auditor recebe 403.
3. **Organizacoes**: validação do CNPJ com dígito verificador, CNPJ repetido (409), contrato 1:1 opcional e versionamento otimista ao atualizar o contrato.
4. **Lotes**: lote criado junto com os equipamentos numa transação só, código de barras interno gerado pelo sistema, data futura ou com mais de 90 dias recusada.
5. **Equipamentos**: desmonte sem triagem é recusado, triagem, queda de 2 níveis no estado exige justificativa, mudança de status gravando a movimentação, versão desatualizada (409).
6. **Relatorios**: rastreio completo de um equipamento (origem, lote, valores e histórico) e resumo de uma organização.
7. **Configuracoes**: alíquotas e depreciação que o admin pode alterar e que entram no cálculo dos valores.

Algumas requisições dependem das anteriores (por exemplo, a triagem do
equipamento 1 vem antes de mover ele para DESMONTE). Se algo sair da ordem, é só
parar o servidor (Ctrl+C) e rodar `npm run dev` de novo para voltar ao banco inicial.

A lista completa de rotas está em [docs/API.md](docs/API.md).

## Problemas comuns

- **`EPERM: operation not permitted, rename ... query_engine`** (Windows): o servidor
  ainda está rodando em outro terminal e trava o arquivo do Prisma. Pare com Ctrl+C e rode de novo.
- **`Access denied for user 'root'`**: a senha no `.env` está errada.
- **Ubuntu, root sem senha**: no Ubuntu o root do MySQL entra sem senha pelo `sudo`.
  Para o Prisma conseguir conectar, defina uma senha:
  `sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'sua_senha';"`
- **Porta 3000 ocupada**: troque `PORT` no `.env`.

## Estrutura

```
prisma/schema/        um arquivo .prisma por model e por enum, e as migrations
src/controllers/      rotas (recebem a requisição e chamam o serviço)
src/services/         regras de negócio, transações e cálculos
src/repositories/     consultas ao banco com o Prisma Client
src/middlewares/      verificação do token JWT e do papel
src/validadores/      validadores da AV1 (CNPJ, data do lote, status, estado)
src/tipos/            enums de status e estado físico
src/seed.ts           dados iniciais
src/server.ts         sobe o Express, trata os erros e faz o desligamento
```

É o padrão Controller-Service-Repository sugerido na AV2: o controller não fala
com o banco e o repositório não tem regra de negócio.

## Decisões

- **Express em vez de Fastify**: a AV2 aceita os dois; usei o Express por já
  conhecer e por ser mais simples para o tamanho do projeto.
- **MySQL em vez de PostgreSQL**: é o banco usado nas aulas e nos exemplos.
  As restrições que importam (CNPJ e código de barras únicos, CHECK de triagem e de datas do contrato) funcionam no MySQL 8.
- **JWT com validade de 30 minutos**: substitui a sessão da AV1 (que expirava em 30 min de inatividade).
  Diferença: o token expira 30 min depois do login, não depois da última ação.
- **bcrypt em vez de SHA-256**: SHA-256 sem salt é rápido demais para guardar senha;
  o bcrypt é lento de propósito e já coloca um salt em cada hash.
- **Transações**: criar lote com equipamentos, e mudar status do equipamento junto com
  o registro da movimentação. Se uma parte falha, nada é gravado.
- **Versionamento otimista**: os models que podem ser alterados têm o campo `versao`.
  Quem altera manda a versão que leu; se outra pessoa alterou antes, a API responde 409.
- **Uma tabela só para equipamentos**: o Prisma não tem herança, então computador,
  monitor e periférico ficaram na mesma tabela com o campo `tipo`.
- **Cálculo financeiro**: valor atual = valor de entrada menos a depreciação mensal
  desde a chegada do lote; impostos = ICMS + ISS sobre o valor atual.
