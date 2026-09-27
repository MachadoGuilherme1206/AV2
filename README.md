# greencode

Sistema de linha de comando para gestão de logística reversa de resíduos
eletrônicos, desenvolvido em Node.js com TypeScript.

## O problema

Uma empresa de médio porte troca em média 40% da sua frota de terminais de
computador a cada dezoito meses. O descarte desses equipamentos gera um passivo
ambiental e financeiro que a contabilidade tradicional ignora, e a Política
Nacional de Resíduos Sólidos exige comprovação de destinação — sem
rastreabilidade, a empresa fica sujeita a multas e restrições operacionais.

O greencode é o núcleo operacional de uma plataforma que conecta os geradores
desses resíduos à cadeia de recuperação de valor, registrando cada equipamento
desde a origem até o destino final.

## O que o sistema faz

- Cadastra organizações geradoras com validação de CNPJ e contratos de coleta
- Registra a chegada de lotes e a triagem de equipamentos
- Controla o ciclo de vida de cada item por uma máquina de estados auditável
- Emite o relatório de rastreabilidade completo de qualquer item
- Mantém um log imutável de todas as transações

## Instalação

Requisitos: **Windows 10 ou superior** e **Node.js 20 ou superior**.

Para instalar o Node, no PowerShell:

```powershell
winget install OpenJS.NodeJS.LTS
```

Se o `winget` não estiver disponível, baixe o instalador LTS em
<https://nodejs.org>. Feche e reabra o PowerShell depois, para que o `PATH` seja
recarregado, e confira com `node --version` — precisa mostrar `v20` ou superior.

Em seguida, na pasta do projeto:

```powershell
npm install
npm run compilar
npm run iniciar
```

Nenhuma biblioteca externa é baixada em tempo de execução: criptografia, leitura
do terminal e acesso a arquivos vêm dos módulos nativos do Node. As únicas
dependências são de desenvolvimento — o compilador TypeScript e as definições de
tipo do Node.

## Primeira execução

Na primeira execução o sistema entra em **modo de provisionamento**: ele detecta
que não existe chave mestra, gera uma automaticamente e pede que você defina o
login e a senha do primeiro administrador.

```
------------------------------------------------------------------------
  PROVISIONAMENTO INICIAL
------------------------------------------------------------------------
[AVISO] Chave mestra nao encontrada. O sistema sera configurado agora.

[SUCESSO] Chave de criptografia AES-256 gerada e gravada em config/master.key
[AVISO] Sem esse arquivo os dados nao podem ser lidos. Guarde uma copia segura.

Login do administrador: admin
Senha do administrador (min. 6 caracteres): ******
Confirme a senha: ******
```

> **Atenção:** perder `config\master.key` significa perder o acesso a todos os
> dados. Não existe recuperação — é essa a consequência de uma criptografia que
> funciona.

## Os quatro papéis

O menu principal se adapta automaticamente a quem está logado, escondendo o que
aquele papel não pode fazer:

| Papel | Responsabilidade |
|---|---|
| `ADMINISTRADOR` | Contas de acesso e parâmetros globais |
| `OPERADOR_CADASTRO` | Organizações clientes e contratos de coleta |
| `GESTOR_ALMOXARIFADO` | Lotes, triagem e movimentação de equipamentos |
| `AUDITOR` | Consultas e relatórios, sem qualquer alteração |

## Como usar: menu numerado ou comando direto

Depois do login aparece o menu do papel, com as opções numeradas:

```
========================================================================
  GREENCODE - ALMOXARIFADO
  gestor | GESTOR_ALMOXARIFADO | sessao expira em 30 min
========================================================================
   [1] Registra a chegada de um lote              lote criar
   [2] Lista os lotes recebidos                   lote listar
   [3] Mostra o lote e seus equipamentos          lote ver
   ...
------------------------------------------------------------------------
   [0] Encerra a sessao                           sair
   [?] Mostra este menu novamente                 ajuda
========================================================================
```

Digitando **o número**, o sistema pergunta cada dado separadamente e mostra o
comando equivalente antes de executar — quem está aprendendo o sistema vê a
forma direta sem precisar decorá-la:

```
greencode> 1

[INFO] Registra a chegada de um lote:
  ID da organizacao (ex.: BR001): BR001
  Numero da nota fiscal: 123456
  Transportadora: TransRapida
  Data de entrada AAAA-MM-DD (em branco usa hoje):
[INFO] Comando equivalente: lote criar --org BR001 --nf 123456 --transp TransRapida
[SUCESSO] Lote LT001 registrado.
```

Campo opcional em branco é simplesmente omitido. Campo obrigatório em branco
cancela a operação, sem gravar nada.

Digitando **o comando inteiro** o resultado é o mesmo, e é o caminho mais rápido
para quem já conhece o sistema. Há autocompletação com `Tab` e o histórico
persiste entre sessões.

## Comandos

A convenção é: o primeiro argumento é a ação, os seguintes são identificadores
ou dados. Opções longas começam com `--`; textos com espaço vão entre aspas.

### Administrador

```
usuario criar --papel GESTOR_ALMOXARIFADO --login gestor --senha senha123
usuario listar
usuario desativar --login gestor
config ver
config definir --chave aliquota.icms --valor 17.5
```

### Operador de cadastro

```
org criar --razao "Banco Meridional S.A." --cnpj 11.222.333/0001-81
          --log "Av. Paulista" --num 1500 --cidade "Sao Paulo" --uf SP
org listar
org ver BR001
contrato criar --org BR001 --numero CT-2026-001 --dias 30
```

### Gestor de almoxarifado

```
lote criar --org BR001 --nf 123456 --transp TransRapida
lote ver LT001

equip criar --lote LT001 --tipo COMPUTADOR --marca Dell --modelo OptiPlex7090
            --proc i5-11500 --memoria 16 --hd sim
equip criar --lote LT001 --tipo MONITOR --polegadas 24 --tec LCD
equip criar --lote LT001 --tipo PERIFERICO --subtipo TECLADO

triagem GC-COM-0001 --estado BOM
equip estado GC-COM-0001 --para RUIM --motivo "placa-mae oxidada"
mover GC-COM-0001 --para DESMONTE
```

### Auditor

```
rastrear GC-COM-0001
relatorio organizacao BR001
journal listar --filtro EQUIP --limite 20
```

## Regras de negócio

O sistema recusa operações que violem qualquer uma destas regras, sempre com
mensagem explicando o motivo:

| Regra | O que impede |
|---|---|
| RN-01 | CNPJ inválido ou já cadastrado |
| RN-02 | Lote com data futura ou anterior a 90 dias |
| RN-03 | Desmonte sem triagem completa; movimentação a partir de status final |
| RN-04 | Queda de duas categorias de estado físico sem justificativa |
| RN-05 | Comando após 30 minutos de sessão inativa |
| RN-06 | Comando fora das permissões do papel |
| RN-07 | Journal maior que 10 MB ou mais antigo que 180 dias |

As mensagens exatas de cada recusa estão em
[docs/FAILURE-SCENARIOS.md](docs/FAILURE-SCENARIOS.md).

## Testes

```powershell
npm run testar
```

Para ver o sistema inteiro funcionando de ponta a ponta, do provisionamento até
a rastreabilidade após múltiplas movimentações:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\jornada-completa.ps1
```

O PowerShell bloqueia scripts `.ps1` por padrão; o `-ExecutionPolicy Bypass`
libera apenas aquela execução, sem alterar a configuração da máquina.

O script apaga os dados existentes, recompila e executa nove etapas, incluindo
os cenários de falha: CNPJ inválido, data fora da janela, desmonte sem triagem,
queda de estado sem justificativa e auditor tentando alterar dados.

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/SECURITY.md](docs/SECURITY.md) | Criptografia, hashing, sessões e limitações conhecidas |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Camadas, decisões técnicas e caminho para as próximas etapas |
| [docs/FAILURE-SCENARIOS.md](docs/FAILURE-SCENARIOS.md) | Cenários de falha testados e respostas do sistema |

## Estrutura do projeto

```
greencode/
├── src/
│   ├── tipos/          Enumerações: estado físico, status, severidade
│   ├── classes/        Domínio: usuários, organizações, lotes, equipamentos
│   ├── validadores/    Regras de negócio, uma classe por regra
│   ├── fabricas/       Criação de objetos compostos
│   ├── repositorios/   Persistência cifrada em arquivo
│   ├── servicos/       Criptografia, journal, autenticação, rastreabilidade
│   ├── cli/            Menus, interpretador de comandos, mensagens
│   ├── util/           Caminhos de arquivo e identificadores
│   └── testes/         Testes unitários
├── docs/               Documentação
├── scripts/            Jornada de teste e limpeza
├── config/             Chave mestra (gerada, nunca versionada)
├── data/               Dados cifrados (gerados, nunca versionados)
└── logs/               Journal e histórico da CLI (gerados)
```

## Licença

MIT.
