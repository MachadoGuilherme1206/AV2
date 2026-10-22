import { Router } from 'express'
import * as servico from '../services/servico-configuracao'
import { autenticar, permitir } from '../middlewares/autenticacao'

const rotas = Router()


rotas.use(autenticar, permitir())

rotas.get('/', async (req, res) => {
    res.json(await servico.listar())
})

rotas.put('/:chave', async (req, res) => {
    res.json(await servico.definir(req.params.chave, req.body?.valor))
})

export default rotas
