import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import ErroApi from '../erro-api'
import { buscarPorLogin } from '../repositories/repositorio-usuario'

const segredoJwt = () => {
    const segredo = process.env.JWT_SECRET

    if (!segredo) {
        throw new Error('JWT_SECRET nao foi definido no .env')
    }
    return segredo
}

const login = async (login: string, senha: string) => {
    if (!login || !senha) {
        throw new ErroApi(400, 'Informe login e senha.')
    }

    const usuario = await buscarPorLogin(login.trim().toLowerCase())

    if (!usuario || !usuario.ativo || !(await bcrypt.compare(senha, usuario.senhaHash))) {
        throw new ErroApi(401, 'Login ou senha invalidos.')
    }

    const token = jwt.sign(
        { id: usuario.id, papel: usuario.papel },
        segredoJwt(),
        { expiresIn: '30m' }
    )

    return { token, papel: usuario.papel }
}

export {
    login,
    segredoJwt
}
