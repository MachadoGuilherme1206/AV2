import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { Papel } from '@prisma/client'
import { segredoJwt } from '../services/servico-autenticacao'

type UsuarioLogado = {
    id: number
    papel: Papel
}

declare global {
    namespace Express {
        interface Request {
            usuario?: UsuarioLogado
        }
    }
}

const autenticar = (req: Request, res: Response, next: NextFunction) => {
    const cabecalho = req.headers.authorization ?? ''
    const [tipo, token] = cabecalho.split(' ')

    if (tipo !== 'Bearer' || !token) {
        res.status(401).json({ erro: 'Token nao informado.' })
        return
    }

    try {
        const dados = jwt.verify(token, segredoJwt()) as UsuarioLogado
        req.usuario = { id: dados.id, papel: dados.papel }
        next()
    } catch {
        res.status(401).json({ erro: 'Token invalido ou expirado. Faca login de novo.' })
    }
}

// O administrador sempre passa; os outros papeis precisam estar na lista.
const permitir = (...papeis: Papel[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const papel = req.usuario?.papel

        if (papel === Papel.ADMINISTRADOR || (papel && papeis.includes(papel))) {
            next()
            return
        }

        res.status(403).json({ erro: 'Seu papel nao tem permissao para esta operacao.' })
    }
}

export {
    autenticar,
    permitir
}
