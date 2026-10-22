import { Router } from 'express'
import * as servico from '../services/servico-usuario'
import { autenticar, permitir } from '../middlewares/autenticacao'

const rotas = Router()

// Gestao de contas e exclusiva do administrador.
rotas.use(autenticar, permitir())

rotas.get('/', async (req, res) => {
    res.json(await servico.listar())
})

rotas.post('/', async (req, res) => {
    const { login, senha, papel } = req.body ?? {}
    const usuario = await servico.criar(login, senha, papel)
    res.status(201).json(usuario)
})

rotas.patch('/:id/desativar', async (req, res) => {
    await servico.desativar(Number(req.params.id), Number(req.body?.versao))
    res.status(204).end()
})

export default rotas
