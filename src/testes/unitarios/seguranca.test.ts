import { test, describe } from 'node:test'
import * as assert from 'node:assert'

import ServicoCriptografia from '../../servicos/servico-criptografia'
import Sessao from '../../classes/sessao'
import FabricaUsuario from '../../fabricas/fabrica-usuario'

describe('Criptografia dos arquivos de persistencia', () => {
    const cripto = new ServicoCriptografia(ServicoCriptografia.gerarChave())

    test('o texto cifrado volta ao original', () => {
        const original = JSON.stringify({ login: 'admin', papel: 'ADMINISTRADOR' })

        assert.strictEqual(cripto.decifrar(cripto.cifrar(original)), original)
    })

    test('o conteudo cifrado nao contem o texto original', () => {
        const cifrado = cripto.cifrar('BANCO MERIDIONAL')

        assert.ok(!cifrado.includes('BANCO'))
    })

    test('o mesmo texto gera saidas diferentes a cada gravacao', () => {
        assert.notStrictEqual(cripto.cifrar('igual'), cripto.cifrar('igual'))
    })

    test('chave de tamanho errado e recusada', () => {
        assert.throws(() => new ServicoCriptografia('abcd'), /32 bytes/)
    })

    test('outra chave nao consegue decifrar', () => {
        const outro = new ServicoCriptografia(ServicoCriptografia.gerarChave())

        assert.throws(() => outro.decifrar(cripto.cifrar('segredo')))
    })

    test('conteudo fora do formato esperado e recusado', () => {
        assert.throws(() => cripto.decifrar('nao-tem-dois-pontos'), /corrompido/)
    })
})

describe('Hash de senha', () => {
    test('a mesma senha gera sempre o mesmo hash', () => {
        assert.strictEqual(
            ServicoCriptografia.gerarHash('senha123'),
            ServicoCriptografia.gerarHash('senha123')
        )
    })

    test('senhas diferentes geram hashes diferentes', () => {
        assert.notStrictEqual(
            ServicoCriptografia.gerarHash('senha123'),
            ServicoCriptografia.gerarHash('senha124')
        )
    })

    test('o hash SHA-256 tem 64 caracteres hexadecimais', () => {
        assert.match(ServicoCriptografia.gerarHash('qualquer'), /^[0-9a-f]{64}$/)
    })

    test('o hash nao contem a senha original', () => {
        assert.ok(!ServicoCriptografia.gerarHash('senha123').includes('senha'))
    })
})

describe('RN-05 - Expiracao de sessao', () => {
    function sessaoNova(): Sessao {
        return new Sessao(FabricaUsuario.criar('ADMINISTRADOR', 'admin', 'hash'))
    }

    test('sessao recem-criada nao esta expirada', () => {
        assert.strictEqual(sessaoNova().expirada(), false)
    })

    test('sessao nova tem praticamente os 30 minutos disponiveis', () => {
        const restantes = sessaoNova().minutosRestantes()

        assert.ok(
            restantes >= Sessao.MINUTOS_INATIVIDADE - 1 && restantes <= Sessao.MINUTOS_INATIVIDADE,
            `esperado 29 ou 30 minutos restantes, obtido ${restantes}`
        )
    })

    test('o limite configurado e de 30 minutos', () => {
        assert.strictEqual(Sessao.MINUTOS_INATIVIDADE, 30)
    })

    test('renovar reinicia a contagem', () => {
        const sessao = sessaoNova()
        sessao.renovar()

        assert.strictEqual(sessao.expirada(), false)
    })
})
