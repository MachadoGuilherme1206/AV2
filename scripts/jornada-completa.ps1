# Jornada completa de usuario do greencode.
#
# Percorre o sistema do provisionamento inicial ate a rastreabilidade de um
# equipamento apos multiplas movimentacoes, passando pelos cenarios de falha.
#
# Uso:  powershell -ExecutionPolicy Bypass -File scripts\jornada-completa.ps1

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

Write-Output '############################################################'
Write-Output '# LIMPANDO AMBIENTE E COMPILANDO'
Write-Output '############################################################'

foreach ($pasta in @('config', 'data', 'logs')) {
    if (Test-Path $pasta) {
        Remove-Item -Recurse -Force $pasta
    }
}

npx tsc

function Invoke-Etapa {
    param(
        [string] $Titulo,
        [string] $Comandos
    )

    Write-Output ''
    Write-Output '############################################################'
    Write-Output "# $Titulo"
    Write-Output '############################################################'

    $Comandos | node out/main.js
}

# ------------------------------------------------------------------
Invoke-Etapa 'ETAPA 1 - Provisionamento inicial e criacao das contas' @'
admin
senha123
senha123
admin
senha123
usuario criar --papel OPERADOR_CADASTRO --login operador --senha senha123
usuario criar --papel GESTOR_ALMOXARIFADO --login gestor --senha senha123
usuario criar --papel AUDITOR --login auditor --senha senha123
usuario listar
config ver
config definir --chave aliquota.icms --valor 17.5
sair
'@

# ------------------------------------------------------------------
Invoke-Etapa 'ETAPA 2 - Operador cadastra a organizacao geradora' @'
operador
senha123
org criar --razao "Banco Meridional S.A." --fantasia Meridional --cnpj 11.222.333/0001-81 --log "Av. Paulista" --num 1500 --bairro "Bela Vista" --cidade "Sao Paulo" --uf SP --cep 01310100
contrato criar --org BR001 --numero CT-2026-001 --dias 30
org ver BR001
sair
'@

# ------------------------------------------------------------------
Invoke-Etapa 'ETAPA 3 - Cenarios de falha no cadastro (RN-01, CNPJ)' @'
operador
senha123
org criar --razao "Empresa Teste" --cnpj 11.222.333/0001-99
org criar --razao "Empresa Duplicada" --cnpj 11222333000181
org criar --razao "Empresa Curta" --cnpj 123
org criar --razao "Empresa Repetida" --cnpj 11111111111111
sair
'@

# ------------------------------------------------------------------
Invoke-Etapa 'ETAPA 4 - Gestor registra o lote e os equipamentos' @'
gestor
senha123
lote criar --org BR001 --nf 123456 --transp TransRapida
equip criar --lote LT001 --tipo COMPUTADOR --codigo GC-COM-0001 --marca Dell --modelo OptiPlex7090 --proc i5-11500 --memoria 16 --hd sim
equip criar --lote LT001 --tipo MONITOR --codigo GC-MON-0001 --marca Dell --modelo P2419H --polegadas 24 --tec LCD
equip criar --lote LT001 --tipo PERIFERICO --codigo GC-PER-0001 --marca Logitech --modelo K120 --subtipo TECLADO
equip listar --lote LT001
sair
'@

# ------------------------------------------------------------------
Invoke-Etapa 'ETAPA 5 - Cenarios de falha (RN-02 datas, RN-03 maquina de estados)' @'
gestor
senha123
lote criar --org BR001 --nf 999 --transp Teste --data 2030-01-01
lote criar --org BR001 --nf 998 --transp Teste --data 2020-01-01
lote criar --org BR999 --nf 997 --transp Teste
mover GC-COM-0001 --para DESMONTE
equip estado GC-COM-0001 --para RUIM
sair
'@

# ------------------------------------------------------------------
Invoke-Etapa 'ETAPA 6 - Triagem e alteracao de estado fisico (RN-04)' @'
gestor
senha123
triagem GC-COM-0001 --estado BOM
triagem GC-MON-0001 --estado REGULAR
triagem GC-PER-0001 --estado NOVO
equip estado GC-COM-0001 --para REGULAR
equip estado GC-COM-0001 --para SUCATA
equip estado GC-COM-0001 --para SUCATA --motivo "placa-mae oxidada, identificada apos abertura do gabinete"
equip listar --lote LT001
sair
'@

# ------------------------------------------------------------------
Invoke-Etapa 'ETAPA 7 - Movimentacoes ate o destino final' @'
gestor
senha123
mover GC-COM-0001 --para DESMONTE
mover GC-COM-0001 --para RECICLADO
mover GC-COM-0001 --para DESCARTADO
mover GC-MON-0001 --para DESCARTADO --motivo "monitor sem valor de revenda"
lote ver LT001
sair
'@

# ------------------------------------------------------------------
Invoke-Etapa 'ETAPA 8 - Auditor consulta, mas nao altera (RN-06)' @'
auditor
senha123
lote criar --org BR001 --nf 111 --transp Proibido
usuario criar --papel ADMINISTRADOR --login invasor
rastrear GC-COM-0001
relatorio organizacao BR001
journal listar --filtro EQUIP --limite 10
sair
'@

# ------------------------------------------------------------------
Invoke-Etapa 'ETAPA 9 - Falha de autenticacao (3 tentativas)' @'
gestor
senhaerrada
naoexiste
qualquer
gestor
outrasenhaerrada
'@

Write-Output ''
Write-Output '############################################################'
Write-Output '# JORNADA CONCLUIDA'
Write-Output '############################################################'
Write-Output ''
Write-Output 'Arquivos gerados (todos cifrados, exceto o journal):'
Get-ChildItem config, data, logs | Format-Table Name, Length, LastWriteTime

Write-Output ''
Write-Output 'Prova de que os dados estao cifrados - primeiros 120 bytes de usuarios.enc:'
(Get-Content data\usuarios.enc -Raw).Substring(0, 120)
