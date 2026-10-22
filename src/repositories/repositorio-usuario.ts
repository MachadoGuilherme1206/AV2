import { Papel } from '@prisma/client'
import prisma from '../prisma'

const camposPublicos = {
    id: true,
    login: true,
    papel: true,
    ativo: true,
    versao: true
}

const buscarPorLogin = async (login: string) => {
    return prisma.usuario.findUnique({
        where: { login }
    })
}

const listar = async () => {
    return prisma.usuario.findMany({
        select: camposPublicos,
        orderBy: { id: 'asc' }
    })
}

const criar = async (login: string, senhaHash: string, papel: Papel) => {
    return prisma.usuario.create({
        data: { login, senhaHash, papel },
        select: camposPublicos
    })
}

const desativar = async (id: number, versao: number) => {
    const resultado = await prisma.usuario.updateMany({
        where: { id, versao },
        data: {
            ativo: false,
            versao: { increment: 1 }
        }
    })
    return resultado.count
}

export {
    buscarPorLogin,
    listar,
    criar,
    desativar
}
