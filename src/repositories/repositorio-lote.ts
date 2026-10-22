import { Prisma } from '@prisma/client'
import prisma from '../prisma'

const criar = async (dados: Prisma.LoteUncheckedCreateInput, db: Prisma.TransactionClient = prisma) => {
    return db.lote.create({ data: dados })
}

const listar = async () => {
    return prisma.lote.findMany({
        include: {
            organizacao: { select: { id: true, razaoSocial: true } },
            _count: { select: { equipamentos: true } }
        },
        orderBy: { id: 'asc' }
    })
}

const buscarPorId = async (id: number) => {
    return prisma.lote.findUnique({
        where: { id },
        include: {
            organizacao: { select: { id: true, razaoSocial: true, cnpj: true } },
            equipamentos: true
        }
    })
}

export {
    criar,
    listar,
    buscarPorId
}
