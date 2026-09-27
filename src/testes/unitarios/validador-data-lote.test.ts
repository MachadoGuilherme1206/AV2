import { test, describe } from 'node:test'
import * as assert from 'node:assert'
import ValidadorDataLote from '../../validadores/validador-data-lote'

function diasAtras(dias: number): Date {
    const data = new Date()
    data.setDate(data.getDate() - dias)
    return data
}

describe('RN-02 - Janela de data do lote', () => {
    const validador = new ValidadorDataLote()

    test('aceita a data de hoje', () => {
        assert.strictEqual(validador.validar(new Date()).valido, true)
    })

    test('aceita data dentro da janela de 90 dias', () => {
        assert.strictEqual(validador.validar(diasAtras(45)).valido, true)
    })

    test('aceita exatamente o limite de 90 dias', () => {
        assert.strictEqual(validador.validar(diasAtras(90)).valido, true)
    })

    test('recusa 91 dias atras', () => {
        const resultado = validador.validar(diasAtras(91))

        assert.strictEqual(resultado.valido, false)
        assert.match(resultado.mensagem, /excede o limite/)
    })

    test('recusa data futura', () => {
        const resultado = validador.validar(diasAtras(-1))

        assert.strictEqual(resultado.valido, false)
        assert.match(resultado.mensagem, /futura/)
    })

    test('recusa valor que nao e data', () => {
        assert.strictEqual(validador.validar('2026-01-01').valido, false)
    })

    test('recusa data invalida', () => {
        assert.strictEqual(validador.validar(new Date('texto qualquer')).valido, false)
    })

    test('converter le o formato AAAA-MM-DD', () => {
        const data = ValidadorDataLote.converter('2026-03-15')

        assert.strictEqual(data.getFullYear(), 2026)
        assert.strictEqual(data.getMonth(), 2)
        assert.strictEqual(data.getDate(), 15)
    })

    test('texto devolve o formato AAAA-MM-DD', () => {
        assert.strictEqual(ValidadorDataLote.texto(new Date(2026, 2, 5)), '2026-03-05')
    })
})
