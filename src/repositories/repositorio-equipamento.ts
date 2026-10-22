import { Prisma, StatusEquipamento, TipoEquipamento } from '@prisma/client'
import prisma from '../prisma'

const contarPorTipo = async (tipo: TipoEquipamento, db: Prisma.TransactionClient = prisma) => {
    return db.equipamento.count({ where: { tipo } })
}

const criar = async (dados: Prisma.EquipamentoUncheckedCreateInput, db: Prisma.TransactionClient = prisma) => {
    return db.equipamento.create({ data: dados })
}

const listar = async (status?: StatusEquipamento, loteId?: number) => {
    return prisma.equipamento.findMany({
        where: { status, loteId },
        orderBy: { id: 'asc' }
    })
}

const buscarPorId = async (id: number) => {
    return prisma.equipamento.findUnique({
        where: { id },
        include: { lote: true }
    })
}

const buscarParaRastreio = async (codigoBarrasInterno: string) => {
    return prisma.equipamento.findUnique({
        where: { codigoBarrasInterno },
        include: {
            lote: { include: { organizacao: true } },
            movimentacoes: {
                include: { usuario: { select: { login: true } } },
                orderBy: { dataHora: 'asc' }
            }
        }
    })
}

const listarPorOrganizacao = async (organizacaoId: number) => {
    return prisma.equipamento.findMany({
        where: { lote: { organizacaoId } },
        include: { lote: true }
    })
}

const atualizar = async (
    id: number,
    versao: number,
    dados: Prisma.EquipamentoUpdateManyMutationInput,
    db: Prisma.TransactionClient = prisma
) => {
    const resultado = await db.equipamento.updateMany({
        where: { id, versao },
        data: { ...dados, versao: { increment: 1 } }
    })
    return resultado.count
}

export {
    contarPorTipo,
    criar,
    listar,
    buscarPorId,
    buscarParaRastreio,
    listarPorOrganizacao,
    atualizar
}
