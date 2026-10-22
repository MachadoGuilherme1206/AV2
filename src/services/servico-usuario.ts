import bcrypt from 'bcryptjs'
import { Papel } from '@prisma/client'
import ErroApi from '../erro-api'
import * as repositorio from '../repositories/repositorio-usuario'

const criar = async (login: string, senha: string, papel: string) => {
    const loginNormalizado = (login ?? '').trim().toLowerCase()

    if (loginNormalizado.length < 3) {
        throw new ErroApi(400, 'Login deve ter no minimo 3 caracteres.')
    }

    if (!senha || senha.length < 6) {
        throw new ErroApi(400, 'Senha deve ter no minimo 6 caracteres.')
    }

    if (!Object.values(Papel).includes(papel as Papel)) {
        throw new ErroApi(400, `Papel invalido. Use: ${Object.values(Papel).join(', ')}.`)
    }

    const senhaHash = await bcrypt.hash(senha, 10)
    return repositorio.criar(loginNormalizado, senhaHash, papel as Papel)
}

const listar = async () => {
    return repositorio.listar()
}

const desativar = async (id: number, versao: number) => {
    const alterados = await repositorio.desativar(id, versao)

    if (alterados === 0) {
        throw new ErroApi(409, 'Usuario nao encontrado ou alterado por outra pessoa. Consulte de novo e tente outra vez.')
    }
}

export {
    criar,
    listar,
    desativar
}
