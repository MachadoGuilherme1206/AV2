# Arquitetura do greencode

## Para que serve este documento

Explicar por que o sistema está dividido do jeito que está, e onde encostar a
mão quando a próxima etapa pedir uma interface web e um banco relacional.

## Visão em três camadas

O código está em `src/`, dividido por tipo de responsabilidade:

```
src/
├── tipos/          Enumerações e apoio: estado físico, status, severidade
├── classes/        O domínio: o que as coisas SÃO
├── validadores/    As regras: o que PODE acontecer
├── fabricas/       A criação: COMO objetos compostos nascem
├── repositorios/   A persistência: ONDE as coisas ficam
├── servicos/       As operações técnicas: criptografia, sessão, journal
├── cli/            A conversa com o usuário: menus, parser, mensagens
├── util/           Caminhos de arquivo e geração de identificadores
├── testes/         Testes unitários
└── main.ts         O ponto de entrada
```

A regra que amarra tudo: **`classes/` não importa nada de `repositorios/` nem de
`cli/`**. Um `Equipamento` sabe recusar uma transição de status inválida, mas
não sabe se está sendo salvo em arquivo, em banco ou em nuvem, nem se quem pediu
foi um terminal ou um navegador.

É por isso que a migração da próxima etapa é barata: trocar `repositorios/` por
uma versão que fala SQL não encosta em nenhuma classe de domínio, e colocar
Express na frente significa escrever um `controllers/` que chama os mesmos
serviços que a CLI chama hoje.

## Por que classes abstratas em vez de funções soltas

Três lugares usam `abstract` e cada um resolve um problema concreto:

**`Usuario`** — os quatro papéis do enunciado compartilham login, senha e
sessão, mas divergem no que podem fazer. O método `permissoes()` é abstrato;
`podeExecutar()` é concreto e escrito uma única vez. O menu principal não tem
`if (papel === 'admin')` em lugar nenhum: ele pede as opções ao usuário logado e
o objeto responde por si.

**`Equipamento`** — um computador, um monitor e um periférico têm ciclo de vida
idêntico (recebido → triado → desmonte) mas atributos e descrição próprios.
`categoria` é abstrato e `descrever()` é sobrescrito em cada subclasse: a mesma
chamada produz a ficha correta de cada tipo. Quando a plataforma crescer para
baterias de veículo elétrico, como o enunciado antecipa, basta uma nova
subclasse — o núcleo não muda.

**`Validador`** — cada regra do enunciado virou uma subclasse com o mesmo
`validar()`. Isso permite tratar as regras como uma lista e aplicá-las em
sequência sem saber qual é qual.

**`RepositorioArquivo`** — a escrita atômica e a criptografia são idênticas para
os cinco arquivos de persistência. Ficam na classe-mãe; as filhas só declaram o
nome do arquivo e os métodos de busca que fazem sentido para cada entidade.

## Fluxo de uma operação, do início ao fim

Tomando o exemplo do enunciado, `lote criar --org BR001 --nf 123456 --transp TransRapida`:

1. `InterpretadorComandos` quebra a linha em ação (`lote`), subação (`criar`) e
   opções (`org`, `nf`, `transp`).
2. `Aplicacao` pergunta à sessão se o usuário logado pode executar `lote criar`.
   Um auditor para aqui, com mensagem de erro de severidade ERRO.
3. Os validadores rodam: a organização existe? A data de entrada está dentro da
   janela de 90 dias?
4. O `Lote` é construído e entregue ao `RepositorioLote`.
5. **Antes** de o arquivo ser tocado, `ServicoJournal` registra a intenção.
6. `RepositorioLote` cifra o conteúdo, grava em `.tmp` e renomeia.
7. A CLI imprime a confirmação com severidade SUCESSO.

A ordem dos passos 5 e 6 é o que o enunciado chama de *journaling*: o log
registra a transação antes de ela ser aplicada, então uma interrupção no meio
deixa rastro do que estava acontecendo.

## Formato dos arquivos de dados

Tudo vive em `data/`, que está no `.gitignore`. Cada arquivo guarda um JSON
cifrado em AES-256-CBC, gravado como `iv:conteudoCifrado` em hexadecimal.

| Arquivo | Conteúdo |
|---|---|
| `config/master.key` | Chave AES gerada no provisionamento — **nunca versionada** |
| `data/usuarios.enc` | Credenciais com senha em SHA-256 |
| `data/organizacoes.enc` | Organizações, endereços e contratos |
| `data/lotes.enc` | Lotes recebidos |
| `data/equipamentos.enc` | Equipamentos e estado atual |
| `data/movimentacoes.enc` | Histórico completo de transições |
| `logs/journal.log` | Log de auditoria, texto puro |
| `logs/historico_cli.txt` | Histórico de comandos do readline |

O journal é o único arquivo em texto puro, e isso é intencional: ele existe para
ser lido por um auditor humano durante uma investigação. Cifrá-lo tornaria a
auditoria dependente do próprio sistema que está sendo auditado.

## Decisões técnicas e seus motivos

| Decisão | Motivo |
|---|---|
| Zero dependências de runtime | Tudo que o sistema precisa (`crypto`, `readline`, `fs`) já vem no Node: instalar numa máquina nova é só `npm install` e `npm run compilar`, sem vulnerabilidade herdada de terceiros. |
| `strict: true` no tsconfig | O enunciado escolheu TypeScript pela tipagem; desligar o modo estrito seria anular o motivo da escolha. |
| `path.join` em todo caminho | Nenhuma barra escrita à mão: o separador de diretório sai do próprio Node. |
| Escrita atômica com `rename` | `rename` é atômico no sistema de arquivos do Windows; uma queda de energia no meio da gravação deixa o arquivo antigo intacto em vez de um arquivo pela metade. |
| AES-256-CBC | Algoritmo pedido pelo enunciado, disponível nativamente, com IV aleatório por gravação. |
| SHA-256 sem salt para senhas | Exigência literal do enunciado. As limitações estão registradas em `SECURITY.md`. |

## O que a próxima etapa vai encontrar pronto

- **Interface web**: os serviços em `servicos/` e as classes em `classes/` são
  reaproveitados inteiros. Só a pasta `cli/` é substituída.
- **Banco relacional**: as cinco subclasses de `RepositorioArquivo` viram
  subclasses de um `RepositorioSQL`. As assinaturas dos métodos
  (`buscarPorId`, `salvar`, `listar`) já estão no formato que um repositório
  de banco usaria.
- **Novas categorias de resíduo**: uma subclasse de `Equipamento` e uma entrada
  na `FabricaEquipamento`.

## Convenção de nomes

Todo identificador escrito por nós está em português: classes, métodos,
atributos, parâmetros e variáveis. As únicas palavras em inglês são as que
pertencem à linguagem ou às bibliotecas do Node — `get`, `set`, `abstract`,
`readonly`, `extends`, `implements`, `constructor`, `console.log`, e os nomes
dos módulos nativos. Termos técnicos consagrados sem tradução corrente, como
*hash* e *journal*, também permanecem, mas sempre como parte de um nome em
português: `gerarHash`, `ServicoJournal`.
