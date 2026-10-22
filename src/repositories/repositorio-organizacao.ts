import { Prisma } from '@prisma/client'
import prisma from '../prisma'

const criar = async (dados: Prisma.OrganizacaoCreateInput) => {
    return prisma.organizacao.create({ data: dados })
}

const listar = async () => {
    return prisma.organizacao.findMany({
        include: { contrato: true },
        orderBy: { id: 'asc' }
    })
}

const buscarPorId = async (id: number) => {
    return prisma.organizacao.findUnique({
        where: { id },
        include: {
            contrato: true,
            lotes: true
        }
    })
}

const buscarContrato = async (organizacaoId: number) => {
    return prisma.contrato.findUnique({
        where: { organizacaoId }
    })
}

const criarContrato = async (dados: Prisma.ContratoUncheckedCreateInput) => {
    return prisma.contrato.create({ data: dados })
}

const atualizarContrato = async (id: number, versao: number, dados: Prisma.ContratoUpdateManyMutationInput) => {
    const resultado = await prisma.contrato.updateMany({
        where: { id, versao },
        data: { ...dados, versao: { increment: 1 } }
    })
    return resultado.count
}

export {
    criar,
    listar,
    buscarPorId,
    buscarContrato,
    criarContrato,
    atualizarContrato
}
