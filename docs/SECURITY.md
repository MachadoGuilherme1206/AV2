# Arquitetura de segurança

Este documento descreve as decisões de segurança do greencode, o motivo de cada
uma, e — igualmente importante — o que elas **não** protegem. A última seção é a
mais relevante para quem vai avaliar o sistema com honestidade.

---

## 1. Criptografia dos dados em repouso

### O que foi adotado

**AES-256 em modo CBC**, com vetor de inicialização aleatório por gravação.

Todos os arquivos de persistência são cifrados: credenciais, organizações,
lotes, equipamentos, movimentações e parâmetros globais. O formato gravado é:

```
<iv em hexadecimal>:<conteúdo cifrado em hexadecimal>
```

### Por que AES-256

O enunciado especifica AES-256, e a escolha se sustenta por conta própria:

- É o padrão adotado pelo NIST e usado em sistemas bancários e governamentais.
- Está disponível nativamente no módulo `node:crypto`, sem dependência externa —
  o que elimina toda uma classe de risco de cadeia de suprimentos.
- O custo computacional é irrelevante para o volume de dados desta aplicação.

### Por que CBC com IV aleatório

O modo CBC exige um vetor de inicialização, e sorteá-lo a cada gravação tem uma
consequência prática visível: **dois arquivos com o mesmo conteúdo produzem
bytes completamente diferentes no disco**. Um observador que tenha acesso ao
sistema de arquivos não consegue saber se dois registros são iguais, nem detectar
que um arquivo voltou a um estado anterior.

O IV não é secreto — ele vai gravado em texto claro antes dos dois-pontos. Isso é
correto e esperado: o IV precisa ser único, não confidencial.

### O que isso protege

| Ameaça | Protegido? |
|---|---|
| Cópia dos arquivos `data/*.enc` por terceiro | Sim — o conteúdo é ilegível sem a chave |
| Leitura casual por outro usuário da máquina | Sim |
| Backup em nuvem exposto acidentalmente | Sim |
| Atacante com acesso a `config/master.key` | **Não** |

### Prova

O teste `seguranca.test.ts` verifica que o conteúdo cifrado não contém o texto
original e que a mesma entrada gera saídas diferentes. A jornada de teste imprime
os primeiros bytes de `usuarios.enc` ao final, para inspeção visual.

---

## 2. Gerenciamento da chave mestra

A chave é gerada por `randomBytes(32)` no provisionamento inicial e gravada em
`config/master.key` com permissão `0600` (leitura e escrita apenas para o dono).

Em sistemas POSIX essa permissão é aplicada de verdade. No Windows o modo é ignorado pelo
sistema de arquivos — o código não muda entre as plataformas, e a limitação está
registrada aqui em vez de escondida.

### Consequência aceita conscientemente

A chave fica em disco, em texto claro, ao lado dos dados que ela protege. Isso
significa que **um atacante com acesso ao sistema de arquivos tem acesso a
tudo**.

A proteção real desta arquitetura é contra o cenário em que os dados vazam sem a
máquina: um pendrive perdido, um backup mal configurado, um repositório
publicado por engano. Por isso `config/` está no `.gitignore` com um comentário
explicando o motivo.

A alternativa correta seria derivar a chave de uma senha digitada a cada
inicialização, nunca gravando-a. Isso foi descartado para esta etapa porque
impediria a execução automatizada dos scripts de teste exigidos pelo enunciado.

---

## 3. Armazenamento de senhas

### O que foi adotado

**SHA-256**, sem salt, conforme especificado pelo enunciado. As senhas ficam em
`data/usuarios.enc`, arquivo separado dos demais dados, também cifrado com
AES-256.

### O que o SHA-256 resolve

É uma função unidirecional: a partir do hash não se recupera a senha por
inversão matemática. Um administrador que leia o arquivo de credenciais não
descobre a senha de ninguém. A senha em texto claro existe apenas como variável
local dentro do `ServicoAutenticacao`, durante a comparação, e não é escrita em
lugar nenhum — nem no journal.

### O que o SHA-256 **não** resolve

Esta é a limitação mais séria do sistema, e é importante declará-la sem rodeios:

**SHA-256 é rápido demais para senhas.** Ele foi projetado para verificar
integridade de arquivos, onde velocidade é uma virtude. Para senhas, velocidade é
exatamente o defeito — ela beneficia quem tenta adivinhar.

Três consequências concretas:

1. **Força bruta viável.** Uma GPU comum calcula bilhões de SHA-256 por segundo.
   Senhas curtas ou comuns caem em minutos.
2. **Rainbow tables funcionam.** Sem salt, o hash de `senha123` é sempre o mesmo
   valor, em qualquer sistema do mundo. Tabelas pré-computadas com bilhões de
   senhas já existem publicamente.
3. **Senhas iguais produzem hashes iguais.** Quem obtiver o arquivo descobre
   imediatamente quais usuários compartilham a mesma senha.

### O que seria correto em produção

**Argon2id**, ou na sua ausência **bcrypt** ou **scrypt**. Os três são
deliberadamente lentos e exigem memória, o que inverte a economia do ataque: o
que custa 200 ms para o servidor legítimo custa anos para quem tenta adivinhar.
Todos usam salt por usuário automaticamente.

`scrypt` está disponível no `node:crypto` nativo, então a migração não exigiria
nenhuma dependência nova. A troca afeta apenas o método
`ServicoCriptografia.gerarHash()` e o campo `senhaHash` no arquivo de
credenciais.

### Mitigação parcial aplicada

O arquivo de credenciais é cifrado com AES-256, então um atacante precisa
primeiro obter a chave mestra para chegar aos hashes. Isso **reduz** a
exposição, mas não corrige o problema: uma vez obtido o arquivo decifrado, todas
as fraquezas acima valem integralmente.

O sistema também exige senha com no mínimo seis caracteres. É pouco, e não
compensa a fraqueza do algoritmo.

---

## 4. Expiração de sessão

Trinta minutos de inatividade, conforme o enunciado. O relógio é reiniciado a
cada comando executado com sucesso.

### Decisão de implementação

A verificação acontece **antes de cada comando**, e não por um temporizador em
segundo plano.

O motivo é duplo. Primeiro, um temporizador manteria o processo vivo e
introduziria concorrência entre a thread do timer e a leitura do terminal.
Segundo, o comportamento não depende de
como cada sistema agenda tarefas.

A consequência aceita: uma sessão abandonada permanece tecnicamente aberta na
memória até que alguém digite algo. Como o processo é local e o terminal
pertence ao usuário, isso não amplia a superfície de ataque — a sessão só é
utilizável por quem já tem o terminal em mãos, e o primeiro comando dessa pessoa
seria recusado.

Há também um aviso quando faltam cinco minutos ou menos, para que o usuário não
perca trabalho no meio de uma operação.

---

## 5. Segregação de responsabilidades

Os quatro papéis do enunciado são classes distintas, cada uma declarando as
próprias permissões. A verificação acontece em dois pontos:

1. **No menu**, que simplesmente não exibe o que o papel não pode fazer.
2. **No despacho do comando**, antes da execução.

O segundo ponto é o que realmente protege. Esconder uma opção do menu é
conveniência, não segurança — um usuário pode digitar qualquer comando. O teste
`permissoes.test.ts` verifica as quatro matrizes de permissão, e a etapa 8 da
jornada demonstra o auditor sendo bloqueado ao tentar criar um lote e uma conta
de administrador.

Toda tentativa negada é registrada no journal com a ação `PERMISSAO_NEGADA`.

---

## 6. Integridade das operações em disco

### Escrita atômica

Toda gravação passa por arquivo temporário seguido de `rename`:

```
data/lotes.enc.tmp  →  data/lotes.enc
```

O `rename` é atômico no sistema de arquivos do Windows. Uma
interrupção brusca — queda de energia, `Ctrl+C`, processo morto — deixa o
arquivo anterior intacto. Nunca existe um arquivo pela metade.

### Journal

Cada transação é registrada em `logs/journal.log` **antes** de os arquivos de
dados serem tocados. Se o processo morrer entre as duas etapas, o log preserva a
intenção, e é possível saber exatamente onde a falha ocorreu.

O journal é o único arquivo em texto puro do sistema, e isso é uma decisão
deliberada: um log de auditoria existe para ser lido por um humano durante uma
investigação, possivelmente sem acesso ao sistema que o gerou. Cifrá-lo faria a
auditoria depender do próprio sistema auditado.

O journal **não** contém senhas, hashes nem conteúdo sensível — apenas quem fez
o quê, quando, e sobre qual registro.

Rotação automática aos 10 MB, retenção mínima de 180 dias, conforme o enunciado.

---

## 7. Resumo das limitações conhecidas

Listadas em ordem de gravidade, para que nenhuma passe despercebida:

| # | Limitação | Impacto | Correção |
|---|---|---|---|
| 1 | SHA-256 sem salt para senhas | Força bruta e rainbow tables viáveis | Migrar para `scrypt` ou Argon2id |
| 2 | Chave mestra em texto claro no disco | Acesso ao sistema de arquivos compromete tudo | Derivar de senha na inicialização, ou usar o cofre do SO |
| 3 | AES-CBC sem autenticação | Adulteração do arquivo não é detectada, só causa erro de decifragem | Migrar para AES-256-GCM |
| 4 | Sem limite de tentativas entre execuções | Três tentativas por execução, mas o processo pode ser reiniciado | Registrar tentativas por usuário no arquivo de credenciais |
| 5 | Senha mínima de 6 caracteres | Permite senhas fracas | Exigir 12 caracteres e verificar contra listas de senhas comuns |
| 6 | Senha digitada aparece no terminal | Exposição a quem estiver olhando a tela | Desligar o eco do terminal durante a leitura |

Os itens 1 e 3 são consequência direta dos algoritmos especificados no
enunciado. Os demais são escolhas de escopo desta primeira etapa.

---

## 8. Cenários de falha testados

A relação completa, com as respostas do sistema, está em
[FAILURE-SCENARIOS.md](FAILURE-SCENARIOS.md).
