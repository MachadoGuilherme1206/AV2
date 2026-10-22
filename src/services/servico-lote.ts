import { Prisma, TipoEquipamento } from '@prisma/client'
import prisma from '../prisma'
import ErroApi from '../erro-api'
import ValidadorDataLote from '../validadores/validador-data-lote'
import * as repositorio from '../repositories/repositorio-lote'
import * as repositorioEquipamento from '../repositories/repositorio-equipamento'
import { buscar as buscarOrganizacao } from './servico-organizacao'

const siglas: Record<TipoEquipamento, string> = {
    COMPUTADOR: 'COMP',
    MONITOR: 'MON',
    PERIFERICO: 'PER'
}

const validarEquipamento = (equipamento: any) => {
    if (!Object.values(TipoEquipamento).includes(equipamento?.tipo)) {
        throw new ErroApi(400, `Tipo de equipamento invalido. Use: ${Object.values(TipoEquipamento).join(', ')}.`)
    }

    if (!equipamento.marca || !equipamento.modelo) {
        throw new ErroApi(400, 'Equipamento precisa de marca e modelo.')
    }

    const valor = Number(equipamento.valor)
    if (Number.isNaN(valor) || valor < 0 || valor > 99999999.99) {
        throw new ErroApi(400, 'Valor do equipamento deve ser um numero entre 0 e 99999999.99.')
    }
}

// O codigo de barras interno e gerado pelo sistema: GC-COMP-0001, GC-MON-0001...
const cadastrarEquipamento = async (equipamento: any, loteId: number, db: Prisma.TransactionClient) => {
    const tipo = equipamento.tipo as TipoEquipamento
    const quantidade = await repositorioEquipamento.contarPorTipo(tipo, db)
    const codigo = `GC-${siglas[tipo]}-${String(quantidade + 1).padStart(4, '0')}`

    return repositorioEquipamento.criar({
        codigoBarrasInterno: codigo,
        tipo,
        marca: equipamento.marca,
        modelo: equipamento.modelo,
        valor: Number(equipamento.valor),
        loteId
    }, db)
}

const criar = async (dados: any) => {
    await buscarOrganizacao(Number(dados?.organizacaoId))

    if (!dados.notaFiscal || !dados.transportadora) {
        throw new ErroApi(400, 'Informe notaFiscal e transportadora.')
    }

    const dataEntrada = ValidadorDataLote.converter(String(dados.dataEntrada ?? ''))
    const resultado = new ValidadorDataLote().validar(dataEntrada)
    if (!resultado.valido) {
        throw new ErroApi(400, resultado.mensagem)
    }

    const equipamentos: any[] = dados.equipamentos ?? []
    equipamentos.forEach(validarEquipamento)

    // O lote e os equipamentos sao gravados juntos: se um falhar, nada e salvo.
    const loteId = await prisma.$transaction(async (tx) => {
        const lote = await repositorio.criar({
            organizacaoId: Number(dados.organizacaoId),
            notaFiscal: String(dados.notaFiscal),
            transportadora: String(dados.transportadora),
            dataEntrada
        }, tx)

        for (const equipamento of equipamentos) {
            await cadastrarEquipamento(equipamento, lote.id, tx)
        }
        return lote.id
    })

    return repositorio.buscarPorId(loteId)
}

const adicionarEquipamento = async (loteId: number, dados: any) => {
    await buscar(loteId)
    validarEquipamento(dados)

    return prisma.$transaction(async (tx) => {
        return cadastrarEquipamento(dados, loteId, tx)
    })
}

const listar = async () => {
    return repositorio.listar()
}

const buscar = async (id: number) => {
    const lote = await repositorio.buscarPorId(id)

    if (!lote) {
        throw new ErroApi(404, 'Lote nao encontrado.')
    }
    return lote
}

export {
    criar,
    adicionarEquipamento,
    listar,
    buscar
}
