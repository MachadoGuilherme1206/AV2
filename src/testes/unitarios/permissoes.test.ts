import { test, describe } from 'node:test'
import * as assert from 'node:assert'

import FabricaUsuario from '../../fabricas/fabrica-usuario'
import InterpretadorComandos from '../../cli/interpretador-comandos'

describe('RN-06 - Permissao por papel', () => {
    const administrador = FabricaUsuario.criar('ADMINISTRADOR', 'admin', 'hash')
    const operador = FabricaUsuario.criar('OPERADOR_CADASTRO', 'operador', 'hash')
    const gestor = FabricaUsuario.criar('GESTOR_ALMOXARIFADO', 'gestor', 'hash')
    const auditor = FabricaUsuario.criar('AUDITOR', 'auditor', 'hash')

    test('administrador pode tudo', () => {
        assert.ok(administrador.podeExecutar('usuario criar'))
        assert.ok(administrador.podeExecutar('lote criar'))
        assert.ok(administrador.podeExecutar('qualquer coisa'))
    })

    test('operador cadastra organizacao, mas nao mexe em lote', () => {
        assert.ok(operador.podeExecutar('org criar'))
        assert.ok(operador.podeExecutar('contrato criar'))
        assert.strictEqual(operador.podeExecutar('lote criar'), false)
        assert.strictEqual(operador.podeExecutar('usuario criar'), false)
    })

    test('gestor movimenta estoque, mas nao cadastra organizacao', () => {
        assert.ok(gestor.podeExecutar('lote criar'))
        assert.ok(gestor.podeExecutar('triagem'))
        assert.ok(gestor.podeExecutar('mover'))
        assert.strictEqual(gestor.podeExecutar('org criar'), false)
        assert.strictEqual(gestor.podeExecutar('usuario criar'), false)
    })

    test('auditor so consulta', () => {
        assert.ok(auditor.podeExecutar('rastrear'))
        assert.ok(auditor.podeExecutar('journal listar'))
        assert.ok(auditor.podeExecutar('org listar'))

        assert.strictEqual(auditor.podeExecutar('org criar'), false)
        assert.strictEqual(auditor.podeExecutar('lote criar'), false)
        assert.strictEqual(auditor.podeExecutar('triagem'), false)
        assert.strictEqual(auditor.podeExecutar('mover'), false)
        assert.strictEqual(auditor.podeExecutar('usuario criar'), false)
    })

    test('todos os papeis compartilham os comandos comuns', () => {
        for (const usuario of [administrador, operador, gestor, auditor]) {
            assert.ok(usuario.podeExecutar('ajuda'), `${usuario.papel} deveria poder pedir ajuda`)
            assert.ok(usuario.podeExecutar('sair'), `${usuario.papel} deveria poder sair`)
        }
    })

    test('usuario desativado nao autentica', () => {
        const desativado = FabricaUsuario.criar('AUDITOR', 'inativo', 'hash')
        desativado.desativar()

        assert.strictEqual(desativado.verificarHash('hash'), false)
    })

    test('papel desconhecido e recusado pela fabrica', () => {
        assert.throws(() => FabricaUsuario.criar('CHEFAO', 'x', 'hash'), /Papel desconhecido/)
    })
})

describe('Interpretador de comandos', () => {
    const interpretador = new InterpretadorComandos()

    test('separa acao, subacao e opcoes', () => {
        const comando = interpretador.analisar('lote criar --org BR001 --nf 123456 --transp TransRapida')

        assert.strictEqual(comando.acao, 'lote')
        assert.strictEqual(comando.subacao, 'criar')
        assert.strictEqual(comando.opcao('org'), 'BR001')
        assert.strictEqual(comando.opcao('nf'), '123456')
        assert.strictEqual(comando.opcao('transp'), 'TransRapida')
        assert.strictEqual(comando.comandoCompleto, 'lote criar')
    })

    test('acao de palavra unica mantem o argumento posicional', () => {
        const comando = interpretador.analisar('triagem GC-COM-0001 --estado BOM')

        assert.strictEqual(comando.acao, 'triagem')
        assert.strictEqual(comando.subacao, '')
        assert.strictEqual(comando.posicional(0), 'GC-COM-0001')
        assert.strictEqual(comando.opcao('estado'), 'BOM')
    })

    test('preserva as maiusculas dos argumentos', () => {
        const comando = interpretador.analisar('rastrear GC-COM-0001')

        assert.strictEqual(comando.posicional(0), 'GC-COM-0001')
    })

    test('mantem unido o texto entre aspas', () => {
        const comando = interpretador.analisar(
            'equip estado GC-COM-0001 --motivo "placa-mae oxidada apos abertura"'
        )

        assert.strictEqual(comando.opcao('motivo'), 'placa-mae oxidada apos abertura')
    })

    test('opcao sem valor vira interruptor ligado', () => {
        const comando = interpretador.analisar('equip criar --lote LT001 --hd')

        assert.strictEqual(comando.opcao('hd'), 'sim')
    })

    test('linha vazia produz comando vazio', () => {
        assert.strictEqual(interpretador.analisar('   ').vazio, true)
    })

    test('opcao obrigatoria ausente lanca erro', () => {
        const comando = interpretador.analisar('lote criar --org BR001')

        assert.throws(() => comando.opcaoObrigatoria('nf'), /--nf/)
    })
})
