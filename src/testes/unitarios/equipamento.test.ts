import { test, describe } from 'node:test'
import * as assert from 'node:assert'

import Computador from '../../classes/computador'
import Monitor from '../../classes/monitor'
import Periferico from '../../classes/periferico'
import Equipamento from '../../classes/equipamento'
import { EstadoFisico } from '../../tipos/estado-fisico'
import { StatusEquipamento } from '../../tipos/status-equipamento'

function novoComputador(): Computador {
    return new Computador('EQ-1', 'GC-COM-0001', 'LT001', 'Dell', 'OptiPlex', 'i5', 16, true)
}

describe('RN-03 - Maquina de estados do equipamento', () => {
    test('equipamento nasce em RECEBIDO e sem estado fisico', () => {
        const equipamento = novoComputador()

        assert.strictEqual(equipamento.statusAtual, StatusEquipamento.RECEBIDO)
        assert.strictEqual(equipamento.estadoAtual, null)
        assert.strictEqual(equipamento.foiTriado, false)
    })

    test('nao permite ir de RECEBIDO direto para DESMONTE', () => {
        const equipamento = novoComputador()

        assert.throws(
            () => equipamento.moverPara(StatusEquipamento.DESMONTE),
            /triagem completa/
        )
    })

    test('triagem leva o equipamento para TRIADO', () => {
        const equipamento = novoComputador()
        equipamento.concluirTriagem(EstadoFisico.BOM)

        assert.strictEqual(equipamento.statusAtual, StatusEquipamento.TRIADO)
        assert.strictEqual(equipamento.estadoAtual, EstadoFisico.BOM)
        assert.strictEqual(equipamento.foiTriado, true)
    })

    test('fluxo completo ate RECICLADO', () => {
        const equipamento = novoComputador()

        equipamento.concluirTriagem(EstadoFisico.REGULAR)
        equipamento.moverPara(StatusEquipamento.DESMONTE)
        equipamento.moverPara(StatusEquipamento.RECICLADO)

        assert.strictEqual(equipamento.statusAtual, StatusEquipamento.RECICLADO)
    })

    test('RECICLADO e status final', () => {
        const equipamento = novoComputador()

        equipamento.concluirTriagem(EstadoFisico.REGULAR)
        equipamento.moverPara(StatusEquipamento.DESMONTE)
        equipamento.moverPara(StatusEquipamento.RECICLADO)

        assert.throws(
            () => equipamento.moverPara(StatusEquipamento.DESCARTADO),
            /status final/
        )
    })

    test('triado pode ser descartado sem passar por desmonte', () => {
        const equipamento = novoComputador()

        equipamento.concluirTriagem(EstadoFisico.SUCATA)
        equipamento.moverPara(StatusEquipamento.DESCARTADO)

        assert.strictEqual(equipamento.statusAtual, StatusEquipamento.DESCARTADO)
    })
})

describe('RN-04 - Justificativa na queda de estado fisico', () => {
    test('alterar estado sem triagem previa e recusado', () => {
        const equipamento = novoComputador()

        assert.throws(
            () => equipamento.alterarEstado(EstadoFisico.RUIM),
            /nao passou por triagem/
        )
    })

    test('queda de uma categoria nao exige justificativa', () => {
        const equipamento = novoComputador()
        equipamento.concluirTriagem(EstadoFisico.BOM)
        equipamento.alterarEstado(EstadoFisico.REGULAR)

        assert.strictEqual(equipamento.estadoAtual, EstadoFisico.REGULAR)
    })

    test('queda de duas categorias sem justificativa e recusada', () => {
        const equipamento = novoComputador()
        equipamento.concluirTriagem(EstadoFisico.BOM)

        assert.throws(
            () => equipamento.alterarEstado(EstadoFisico.RUIM),
            /exige justificativa/
        )
    })

    test('queda de duas categorias com justificativa curta e recusada', () => {
        const equipamento = novoComputador()
        equipamento.concluirTriagem(EstadoFisico.BOM)

        assert.throws(
            () => equipamento.alterarEstado(EstadoFisico.RUIM, 'quebrou'),
            /exige justificativa/
        )
    })

    test('queda de duas categorias com justificativa adequada e aceita', () => {
        const equipamento = novoComputador()
        equipamento.concluirTriagem(EstadoFisico.BOM)
        equipamento.alterarEstado(EstadoFisico.RUIM, 'danificado durante o transporte')

        assert.strictEqual(equipamento.estadoAtual, EstadoFisico.RUIM)
    })

    test('subir de estado nunca exige justificativa', () => {
        const equipamento = novoComputador()
        equipamento.concluirTriagem(EstadoFisico.SUCATA)
        equipamento.alterarEstado(EstadoFisico.NOVO)

        assert.strictEqual(equipamento.estadoAtual, EstadoFisico.NOVO)
    })

    test('exigeJustificativaPara avisa antes da tentativa', () => {
        const equipamento = novoComputador()
        equipamento.concluirTriagem(EstadoFisico.NOVO)

        assert.strictEqual(equipamento.exigeJustificativaPara(EstadoFisico.BOM), false)
        assert.strictEqual(equipamento.exigeJustificativaPara(EstadoFisico.REGULAR), true)
    })
})

describe('Polimorfismo - cada subclasse se descreve do seu jeito', () => {
    test('a mesma chamada produz a descricao propria de cada classe', () => {
        const computador = new Computador('1', 'GC-COM-0001', 'LT1', 'Dell', 'X', 'i5', 16, false)
        const monitor = new Monitor('2', 'GC-MON-0001', 'LT1', 'Dell', 'Y', 24, 'LCD')
        const periferico = new Periferico('3', 'GC-PER-0001', 'LT1', 'Log', 'Z', 'TECLADO')

        const itens: Equipamento[] = [computador, monitor, periferico]
        itens.forEach((item) => item.concluirTriagem(EstadoFisico.NOVO))

        const descricoes = itens.map((item) => item.descrever())

        assert.match(descricoes[0] as string, /COMPUTADOR .* i5, 16GB, sem HD$/)
        assert.match(descricoes[1] as string, /MONITOR .* 24" LCD$/)
        assert.match(descricoes[2] as string, /PERIFERICO .* tipo TECLADO$/)
    })

    test('a categoria vem da subclasse, nao da base', () => {
        const itens: Equipamento[] = [
            new Computador('1', 'A', 'LT1', 'Dell', 'X', 'i5', 8, true),
            new Monitor('2', 'B', 'LT1', 'Dell', 'Y', 21, 'CRT'),
            new Periferico('3', 'C', 'LT1', 'Log', 'Z', 'MOUSE')
        ]

        assert.deepStrictEqual(
            itens.map((item) => item.categoria),
            ['COMPUTADOR', 'MONITOR', 'PERIFERICO']
        )
    })

    test('monitor de tubo avisa a presenca de chumbo na descricao', () => {
        const crt = new Monitor('1', 'A', 'LT1', 'Generico', 'CRT15', 15, 'crt')
        crt.concluirTriagem(EstadoFisico.RUIM)

        assert.strictEqual(crt.ehTuboDeRaios, true)
        assert.match(crt.descrever(), /contem chumbo$/)
    })
})
