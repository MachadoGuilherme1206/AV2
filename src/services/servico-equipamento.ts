import { Equipamento, StatusEquipamento as Status } from '@prisma/client'
import prisma from '../prisma'
import ErroApi from '../erro-api'
import ValidadorTransicaoStatus from '../validadores/validador-transicao-status'
import ValidadorQuedaEstado from '../validadores/validador-queda-estado'
import { estadoPorNome, estadosDisponiveis } from '../tipos/estado-fisico'
import { statusPorNome } from '../tipos/status-equipamento'
import * as repositorio from '../repositories/repositorio-equipamento'
import * as repositorioMovimentacao from '../repositories/repositorio-movimentacao'
import { listar as listarConfiguracoes } from './servico-configuracao'

const buscar = async (id: number) => {
    const equipamento = await repositorio.buscarPorId(id)

    if (!equipamento) {
        throw new ErroApi(404, 'Equipamento nao encontrado.')
    }
    return equipamento
}

const listar = async (status?: string, loteId?: string) => {
    if (status && !statusPorNome(status)) {
        throw new ErroApi(400, `Status invalido. Use: ${Object.values(Status).join(', ')}.`)
    }

    return repositorio.listar(
        status ? (status.toUpperCase() as Status) : undefined,
        loteId ? Number(loteId) : undefined
    )
}

const validarTransicao = (atual: Status, destino: Status) => {
    const resultado = new ValidadorTransicaoStatus(statusPorNome(atual)!).validar(statusPorNome(destino))
    if (!resultado.valido) {
        throw new ErroApi(400, resultado.mensagem)
    }
}

// Atualiza o equipamento e grava a movimentacao na mesma transacao.
const registrarMudanca = async (
    equipamento: Equipamento,
    versao: number,
    dados: { status: Status, estado?: any },
    usuarioId: number,
    justificativa: string
) => {
    await prisma.$transaction(async (tx) => {
        const alterados = await repositorio.atualizar(equipamento.id, versao, dados, tx)

        if (alterados === 0) {
            throw new ErroApi(409, 'O equipamento foi alterado por outra pessoa (versao diferente). Consulte de novo e tente outra vez.')
        }

        await repositorioMovimentacao.criar({
            equipamentoId: equipamento.id,
            usuarioId,
            de: equipamento.status,
            para: dados.status,
            justificativa
        }, tx)
    })

    return buscar(equipamento.id)
}

const triar = async (id: number, dados: any, usuarioId: number) => {
    const equipamento = await buscar(id)

    if (!estadoPorNome(String(dados?.estado ?? ''))) {
        throw new ErroApi(400, `Estado invalido. Use: ${estadosDisponiveis().join(', ')}.`)
    }

    validarTransicao(equipamento.status, Status.TRIADO)

    return registrarMudanca(
        equipamento,
        Number(dados.versao),
        { status: Status.TRIADO, estado: String(dados.estado).toUpperCase() },
        usuarioId,
        'triagem concluida'
    )
}

const mover = async (id: number, dados: any, usuarioId: number) => {
    const equipamento = await buscar(id)
    const destino = statusPorNome(String(dados?.para ?? ''))

    if (!destino) {
        throw new ErroApi(400, `Status invalido. Use: ${Object.values(Status).join(', ')}.`)
    }

    validarTransicao(equipamento.status, destino as Status)

    return registrarMudanca(
        equipamento,
        Number(dados.versao),
        { status: destino as Status },
        usuarioId,
        String(dados.justificativa ?? '')
    )
}

const alterarEstado = async (id: number, dados: any) => {
    const equipamento = await buscar(id)

    if (!equipamento.estado) {
        throw new ErroApi(400, 'O equipamento ainda nao passou pela triagem.')
    }

    const novoEstado = estadoPorNome(String(dados?.estado ?? ''))
    if (!novoEstado) {
        throw new ErroApi(400, `Estado invalido. Use: ${estadosDisponiveis().join(', ')}.`)
    }

    const resultado = new ValidadorQuedaEstado(estadoPorNome(equipamento.estado)!).validar({
        novoEstado,
        justificativa: String(dados.justificativa ?? '')
    })
    if (!resultado.valido) {
        throw new ErroApi(400, resultado.mensagem)
    }

    const alterados = await repositorio.atualizar(id, Number(dados.versao), {
        estado: String(dados.estado).toUpperCase() as any
    })
    if (alterados === 0) {
        throw new ErroApi(409, 'O equipamento foi alterado por outra pessoa (versao diferente). Consulte de novo e tente outra vez.')
    }

    return buscar(id)
}

// Valor de hoje = valor de entrada menos a depreciacao mensal desde a chegada do lote.
// Os impostos (ICMS + ISS) sao calculados sobre esse valor.
const calcularValores = async (valor: number, dataEntrada: Date) => {
    const configuracoes = await listarConfiguracoes()
    const meses = Math.floor((Date.now() - dataEntrada.getTime()) / (1000 * 60 * 60 * 24 * 30))
    const depreciacao = Math.min(1, meses * configuracoes['depreciacao.mensal'] / 100)
    const valorAtual = valor * (1 - depreciacao)
    const impostos = valorAtual * (configuracoes['aliquota.icms'] + configuracoes['aliquota.iss']) / 100

    return {
        valorEntrada: valor,
        mesesDesdeEntrada: meses,
        valorAtual: Number(valorAtual.toFixed(2)),
        impostos: Number(impostos.toFixed(2))
    }
}

const rastrear = async (codigo: string) => {
    const equipamento = await repositorio.buscarParaRastreio(codigo.trim().toUpperCase())

    if (!equipamento) {
        throw new ErroApi(404, 'Equipamento nao encontrado.')
    }

    const organizacao = equipamento.lote.organizacao

    return {
        codigoBarrasInterno: equipamento.codigoBarrasInterno,
        tipo: equipamento.tipo,
        marca: equipamento.marca,
        modelo: equipamento.modelo,
        status: equipamento.status,
        estado: equipamento.estado,
        origem: {
            organizacao: organizacao.razaoSocial,
            cnpj: organizacao.cnpj,
            endereco: `${organizacao.logradouro}, ${organizacao.numero} - ${organizacao.bairro}, ${organizacao.cidade}/${organizacao.uf}`
        },
        lote: {
            id: equipamento.lote.id,
            notaFiscal: equipamento.lote.notaFiscal,
            transportadora: equipamento.lote.transportadora,
            dataEntrada: equipamento.lote.dataEntrada
        },
        valores: await calcularValores(Number(equipamento.valor), equipamento.lote.dataEntrada),
        historico: equipamento.movimentacoes.map((movimentacao) => ({
            dataHora: movimentacao.dataHora,
            de: movimentacao.de,
            para: movimentacao.para,
            usuario: movimentacao.usuario.login,
            justificativa: movimentacao.justificativa
        }))
    }
}

export {
    buscar,
    listar,
    triar,
    mover,
    alterarEstado,
    calcularValores,
    rastrear
}
