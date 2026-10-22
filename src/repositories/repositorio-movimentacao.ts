import { Prisma } from '@prisma/client'
import prisma from '../prisma'

const criar = async (dados: Prisma.MovimentacaoUncheckedCreateInput, db: Prisma.TransactionClient = prisma) => {
    return db.movimentacao.create({ data: dados })
}

export {
    criar
}
