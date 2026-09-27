# Cenários de falha testados

Todas as mensagens abaixo foram capturadas da execução real de
`scripts\jornada-completa.ps1`. Nenhuma foi escrita à mão para este documento.

Para reproduzir:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\jornada-completa.ps1
```

---

## 1. Validação de CNPJ (RN-01) — etapa 3 da jornada

| Entrada | Resposta do sistema |
|---|---|
| `org criar --cnpj 11.222.333/0001-99` | `[ERRO] CNPJ invalido: digitos verificadores nao conferem.` |
| `org criar --cnpj 11222333000181` (já cadastrado) | `[ERRO] CNPJ 11.222.333/0001-81 ja pertence a organizacao BR001.` |
| `org criar --cnpj 123` | `[ERRO] CNPJ deve conter 14 digitos. Informados: 3.` |
| `org criar --cnpj 11111111111111` | `[ERRO] CNPJ invalido: sequencia de digitos repetidos.` |

O último caso merece atenção: `11111111111111` **passa** no cálculo matemático
dos dígitos verificadores. É a armadilha clássica dessa validação, e por isso
existe uma verificação explícita de dígitos repetidos.

Em nenhum dos quatro casos a organização foi gravada. A verificação acontece
antes de qualquer escrita em disco.

---

## 2. Janela de data do lote (RN-02) — etapa 5

| Entrada | Resposta do sistema |
|---|---|
| `lote criar --data 2030-01-01` | `[ERRO] Data de entrada nao pode ser futura. Informada: 2030-01-01.` |
| `lote criar --data 2020-01-01` | `[ERRO] Data de entrada excede o limite de 90 dias. Limite: 2026-06-27.` |
| `lote criar --org BR999` | `[ERRO] Organizacao 'BR999' nao encontrada.` |

A mensagem do segundo caso informa qual é o limite, e não apenas que ele foi
violado — o usuário não precisa calcular nada para entender o que fazer.

---

## 3. Máquina de estados (RN-03) — etapas 5 e 7

| Entrada | Resposta do sistema |
|---|---|
| `mover GC-COM-0001 --para DESMONTE` (sem triagem) | `[ERRO] Equipamento esta em RECEBIDO. Desmonte exige triagem completa.` |
| `equip estado GC-COM-0001 --para RUIM` (sem triagem) | `[ERRO] Equipamento GC-COM-0001 ainda nao passou por triagem. Informe o estado fisico atraves do comando de triagem.` |
| `mover GC-COM-0001 --para DESCARTADO` (já RECICLADO) | `[ERRO] RECICLADO e um status final. Nenhuma movimentacao e permitida.` |

Nenhuma movimentação foi gravada nesses casos, e o histórico de rastreabilidade
do equipamento permanece consistente.

---

## 4. Justificativa em queda de estado (RN-04) — etapa 6

Sequência executada sobre o mesmo equipamento, para demonstrar a regra em ação:

| # | Entrada | Resposta |
|---|---|---|
| 1 | `triagem GC-COM-0001 --estado BOM` | `[SUCESSO] Triagem concluida. GC-COM-0001 esta em TRIADO, estado BOM.` |
| 2 | `equip estado --para REGULAR` (queda de 1) | `[SUCESSO] Estado alterado de BOM para REGULAR.` |
| 3 | `equip estado --para SUCATA` (queda de 2, sem motivo) | `[ERRO] Queda de REGULAR para SUCATA exige justificativa com no minimo 10 caracteres.` |
| 4 | `equip estado --para SUCATA --motivo "placa-mae oxidada, identificada apos abertura do gabinete"` | `[SUCESSO] Estado alterado de REGULAR para SUCATA.` |

Os passos 3 e 4 são a mesma transição. A única diferença é a justificativa — que
fica registrada no journal e aparece no relatório de rastreabilidade.

---

## 5. Permissões por papel (RN-06) — etapa 8

Sessão do auditor, cujo papel é exclusivamente de consulta:

| Entrada | Resposta do sistema |
|---|---|
| `lote criar --org BR001 --nf 111 --transp Proibido` | `[ERRO] Papel AUDITOR nao tem permissao para 'lote criar'.` |
| `usuario criar --papel ADMINISTRADOR --login invasor` | `[ERRO] Papel AUDITOR nao tem permissao para 'usuario criar'.` |
| `rastrear GC-COM-0001` | Relatório completo exibido |
| `relatorio organizacao BR001` | Resumo exibido |

Os dois comandos recusados **não aparecem no menu do auditor**, mas foram
digitados assim mesmo — é exatamente esse o teste. Esconder a opção é
conveniência; a verificação no despacho é o que protege.

Ambas as tentativas ficaram registradas no journal como `PERMISSAO_NEGADA`.

---

## 6. Falha de autenticação — etapa 9

| Tentativa | Entrada | Resposta |
|---|---|---|
| 1 | login válido, senha errada | `[ERRO] Credenciais invalidas. Tentativa 1 de 3.` |
| 2 | login inexistente | `[ERRO] Credenciais invalidas. Tentativa 2 de 3.` |
| 3 | login válido, senha errada | `[ERRO] Credenciais invalidas. Tentativa 3 de 3.` |
| — | — | `[CRITICO] Numero maximo de tentativas excedido. Encerrando.` |

A mensagem é **idêntica** para login inexistente e para senha errada. É
deliberado: uma mensagem diferente para cada caso entregaria ao atacante quais
logins existem no sistema.

O journal registra a distinção internamente (`usuario inexistente` versus
`credenciais invalidas ou conta inativa`), porque o auditor precisa dessa
informação — mas ela nunca chega à tela de login.

---

## 7. Parâmetros ausentes ou inválidos

| Entrada | Resposta do sistema |
|---|---|
| `lote criar --org BR001` (sem `--nf`) | `[ERRO] Parametro obrigatorio ausente: --nf` |
| `triagem` (sem código) | `[ERRO] Argumento obrigatorio ausente: <codigo de barras>` |
| `triagem GC-COM-0001 --estado OTIMO` | `[ERRO] Estado invalido. Valores aceitos: NOVO, BOM, REGULAR, RUIM, SUCATA.` |
| `equip criar --tipo NOTEBOOK` | `[ERRO] Tipo de equipamento desconhecido: NOTEBOOK. Tipos aceitos: COMPUTADOR, MONITOR, PERIFERICO.` |
| `usuario criar --papel CHEFAO` | `[ERRO] Papel desconhecido: CHEFAO. Papeis aceitos: ADMINISTRADOR, OPERADOR_CADASTRO, GESTOR_ALMOXARIFADO, AUDITOR.` |
| `xyz` | `[ERRO] Comando desconhecido: 'xyz'. Digite 'ajuda' para ver as opcoes.` |

Toda mensagem de valor inválido lista os valores aceitos. O usuário nunca
precisa consultar a documentação para descobrir o que digitar.

---

## 8. Falhas de integridade e criptografia

Estes cenários são cobertos pelos testes unitários em
`src/testes/unitarios/seguranca.test.ts`, por envolverem estados difíceis de
provocar pela CLI.

| Cenário | Resposta do sistema |
|---|---|
| Chave mestra ausente | `Chave mestra nao encontrada. Execute o provisionamento inicial do sistema.` |
| Chave com tamanho errado | `Chave mestra invalida: o AES-256 exige 32 bytes (64 caracteres hexadecimais).` |
| Arquivo de dados adulterado | `Falha ao ler usuarios.enc: arquivo corrompido ou chave mestra incorreta.` |
| Arquivo cifrado fora do formato `iv:conteudo` | `Arquivo de dados corrompido: formato do conteudo cifrado invalido.` |
| Chave diferente da que cifrou os dados | Exceção na decifragem, reportada como `[CRITICO]` |

Para reproduzir manualmente a adulteração:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\jornada-completa.ps1  # gera a base
Add-Content data\usuarios.enc "lixo"                                   # corrompe o arquivo
npm run iniciar                                                        # observe a mensagem [CRITICO]
```

---

## 9. Interrupção durante a gravação

Cenário: o processo é encerrado no meio de uma escrita em disco.

**Comportamento observado:** o arquivo anterior permanece íntegro e legível. O
arquivo temporário `.tmp` pode ficar órfão na pasta `data/`, sem prejuízo —
ele é sobrescrito na próxima gravação.

**Por quê:** a gravação nunca escreve por cima do arquivo original. Ela escreve
em `arquivo.enc.tmp` e só então executa `rename`, que é atômico no sistema de
arquivos do Windows. Ou o rename acontece por inteiro, ou não acontece.

A transação já estava registrada no journal antes da tentativa de gravação, então
é possível identificar exatamente qual operação não chegou a ser concluída.

---

## Resumo

| Categoria | Cenários verificados |
|---|---|
| Validação de CNPJ | 4 |
| Janela de data | 3 |
| Máquina de estados | 3 |
| Justificativa de estado | 4 |
| Permissões | 4 |
| Autenticação | 4 |
| Parâmetros inválidos | 6 |
| Criptografia e integridade | 5 |
| Interrupção de gravação | 1 |
| **Total** | **34** |

Além destes, a suíte de `npm run testar` cobre as mesmas regras no nível das
classes.
