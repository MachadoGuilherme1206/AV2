# Rotas da API

Base: `http://localhost:3000`

Todas as rotas, menos o login, precisam do cabeçalho:

```
Authorization: Bearer <token>
```

Erros sempre voltam no formato `{ "erro": "mensagem" }`:

| Código | Quando |
|---|---|
| 400 | dado inválido ou regra de negócio quebrada |
| 401 | sem token, token inválido/expirado ou login errado |
| 403 | o papel do usuário não pode fazer a operação |
| 404 | registro ou rota não encontrada |
| 409 | valor repetido (CNPJ, login...) ou versão desatualizada |

Papéis: ADM = administrador, OPE = operador de cadastro, GES = gestor de almoxarifado,
AUD = auditor. O administrador pode tudo.

## Autenticação

| Método | Rota | Papel | Corpo |
|---|---|---|---|
| POST | `/auth/login` | - | `{ "login", "senha" }` |

Resposta: `{ "token": "...", "papel": "GESTOR_ALMOXARIFADO" }`. O token vale 30 minutos.

## Usuários

| Método | Rota | Papel | Corpo |
|---|---|---|---|
| GET | `/usuarios` | ADM | - |
| POST | `/usuarios` | ADM | `{ "login", "senha", "papel" }` |
| PATCH | `/usuarios/:id/desativar` | ADM | `{ "versao" }` |

`papel`: ADMINISTRADOR, OPERADOR_CADASTRO, GESTOR_ALMOXARIFADO ou AUDITOR.
Login com no mínimo 3 caracteres e senha com no mínimo 6.

## Organizações e contrato

| Método | Rota | Papel | Corpo |
|---|---|---|---|
| GET | `/organizacoes` | todos | - |
| GET | `/organizacoes/:id` | todos | - |
| POST | `/organizacoes` | OPE | `{ "razaoSocial", "nomeFantasia", "cnpj", "logradouro", "numero", "bairro", "cidade", "uf", "cep" }` |
| PUT | `/organizacoes/:id/contrato` | OPE | `{ "numero", "dataInicio", "dataFim", "periodicidadeDias", "versao" }` |

- O CNPJ pode vir com ou sem pontuação e é validado pelos dígitos verificadores.
- Cada organização tem no máximo um contrato. Se ainda não tem, o PUT cria
  (sem `versao`); se já tem, o PUT atualiza e exige a `versao` atual.
- Datas no formato `AAAA-MM-DD`; `dataFim` depois de `dataInicio`.

## Lotes

| Método | Rota | Papel | Corpo |
|---|---|---|---|
| GET | `/lotes` | todos | - |
| GET | `/lotes/:id` | todos | - |
| POST | `/lotes` | GES | `{ "organizacaoId", "notaFiscal", "transportadora", "dataEntrada", "equipamentos": [ ... ] }` |
| POST | `/lotes/:id/equipamentos` | GES | `{ "tipo", "marca", "modelo", "valor" }` |

- `dataEntrada` não pode ser futura nem ter mais de 90 dias.
- `equipamentos` é opcional; cada item tem `tipo` (COMPUTADOR, MONITOR ou PERIFERICO),
  `marca`, `modelo` e `valor`. O lote e os equipamentos são gravados numa transação só.
- O código de barras interno é gerado pelo sistema: `GC-COMP-0001`, `GC-MON-0001`, `GC-PER-0001`...

## Equipamentos

| Método | Rota | Papel | Corpo |
|---|---|---|---|
| GET | `/equipamentos?status=&loteId=` | todos | - |
| GET | `/equipamentos/:id` | todos | - |
| PATCH | `/equipamentos/:id/triagem` | GES | `{ "estado", "versao" }` |
| PATCH | `/equipamentos/:id/status` | GES | `{ "para", "justificativa", "versao" }` |
| PATCH | `/equipamentos/:id/estado` | GES | `{ "estado", "justificativa", "versao" }` |

- Estados: NOVO, BOM, REGULAR, RUIM, SUCATA.
- Caminho do status: RECEBIDO → TRIADO → DESMONTE → RECICLADO, ou TRIADO → DESCARTADO.
  RECICLADO e DESCARTADO são finais. Desmonte só depois da triagem.
- Triagem e mudança de status gravam uma movimentação na mesma transação.
- Baixar o estado 2 níveis ou mais (ex.: NOVO → REGULAR) exige justificativa com 10+ caracteres.

## Relatórios

| Método | Rota | Papel |
|---|---|---|
| GET | `/relatorios/rastreio/:codigo` | todos |
| GET | `/relatorios/organizacoes/:id` | todos |

- Rastreio: origem (organização), lote, valores (valor de entrada, valor atual
  depreciado e impostos) e o histórico de movimentações com quem fez cada uma.
- Resumo da organização: total de lotes e equipamentos, quantidade por status,
  valor atual total e impostos.

## Configurações

| Método | Rota | Papel | Corpo |
|---|---|---|---|
| GET | `/configuracoes` | ADM | - |
| PUT | `/configuracoes/:chave` | ADM | `{ "valor" }` |

Chaves: `aliquota.icms`, `aliquota.iss`, `depreciacao.mensal` (porcentagens de 0 a 100).
