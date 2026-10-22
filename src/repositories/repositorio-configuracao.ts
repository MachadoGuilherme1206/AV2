import prisma from '../prisma'

const listar = async () => {
    return prisma.configuracao.findMany({ orderBy: { chave: 'asc' } })
}

const definir = async (chave: string, valor: string) => {
    return prisma.configuracao.upsert({
        where: { chave },
        update: { valor },
        create: { chave, valor }
    })
}

export {
    listar,
    definir
}
