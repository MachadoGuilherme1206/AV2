import { test, describe } from 'node:test'
import * as assert from 'node:assert'
import ValidadorCNPJ from '../../validadores/validador-cnpj'

describe('RN-01 - Validacao de CNPJ', () => {
    const validador = new ValidadorCNPJ()

    test('aceita CNPJ valido com mascara', () => {
        assert.strictEqual(validador.validar('11.222.333/0001-81').valido, true)
    })

    test('aceita o mesmo CNPJ sem mascara', () => {
        assert.strictEqual(validador.validar('11222333000181').valido, true)
    })

    test('recusa digito verificador errado', () => {
        const resultado = validador.validar('11.222.333/0001-99')

        assert.strictEqual(resultado.valido, false)
        assert.match(resultado.mensagem, /digitos verificadores/)
    })

    test('recusa quantidade de digitos diferente de 14', () => {
        const resultado = validador.validar('123')

        assert.strictEqual(resultado.valido, false)
        assert.match(resultado.mensagem, /14 digitos/)
    })

    test('recusa sequencia de digitos repetidos', () => {
        const resultado = validador.validar('11111111111111')

        assert.strictEqual(resultado.valido, false)
        assert.match(resultado.mensagem, /repetidos/)
    })

    test('recusa valor que nao e texto', () => {
        assert.strictEqual(validador.validar(11222333000181).valido, false)
    })

    test('validarOuFalhar lanca erro quando invalido', () => {
        assert.throws(() => validador.validarOuFalhar('00000000000000'))
    })

    test('validarOuFalhar nao lanca quando valido', () => {
        assert.doesNotThrow(() => validador.validarOuFalhar('11222333000181'))
    })

    test('formatar aplica a mascara', () => {
        assert.strictEqual(ValidadorCNPJ.formatar('11222333000181'), '11.222.333/0001-81')
    })

    test('apenasDigitos remove a pontuacao', () => {
        assert.strictEqual(ValidadorCNPJ.apenasDigitos('11.222.333/0001-81'), '11222333000181')
    })
})
