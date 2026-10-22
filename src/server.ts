import express, { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from './prisma'
import ErroApi from './erro-api'
import rotasAutenticacao from './controllers/controller-autenticacao'
import rotasUsuario from './controllers/controller-usuario'
import rotasOrganizacao from './controllers/controller-organizacao'
import rotasLote from './controllers/controller-lote'
import rotasEquipamento from './controllers/controller-equipamento'
import rotasRelatorio from './controllers/controller-relatorio'
import rotasConfiguracao from './controllers/controller-configuracao'

const app = express()
app.use(express.json())

app.use('/auth', rotasAutenticacao)
app.use('/usuarios', rotasUsuario)
app.use('/organizacoes', rotasOrganizacao)
app.use('/lotes', rotasLote)
app.use('/equipamentos', rotasEquipamento)
app.use('/relatorios', rotasRelatorio)
app.use('/configuracoes', rotasConfiguracao)

app.use((_req: Request, res: Response) => {
    res.status(404).json({ erro: 'Rota nao encontrada.' })
})

app.use((erro: any, _req: Request, res: Response, _next: NextFunction) => {
    if (erro instanceof ErroApi) {
        res.status(erro.status).json({ erro: erro.message })
        return
    }

    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        res.status(409).json({ erro: `Ja existe um registro com este valor (${erro.meta?.target}).` })
        return
    }

    if (erro instanceof Prisma.PrismaClientValidationError) {
        res.status(400).json({ erro: 'Dados invalidos. Confira os campos e os ids enviados.' })
        return
    }

    if (erro?.type === 'entity.parse.failed') {
        res.status(400).json({ erro: 'JSON invalido no corpo da requisicao.' })
        return
    }

    console.error(erro)
    res.status(500).json({ erro: 'Erro interno no servidor.' })
})

const porta = Number(process.env.PORT ?? 3000)

const servidor = app.listen(porta, () => {
    console.log(`greencode rodando na porta ${porta}`)
})

const desligar = () => {
    console.log('Desligando o servidor...')
    servidor.close(async () => {
        await prisma.$disconnect()
        console.log('Servidor desligado.')
        process.exit(0)
    })
}

process.on('SIGINT', desligar)
process.on('SIGTERM', desligar)
