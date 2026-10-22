import { Router } from 'express'
import { Papel } from '@prisma/client'
import * as servico from '../services/servico-lote'
import { autenticar, permitir } from '../middlewares/autenticacao'

const rotas = Router()

rotas.use(autenticar)

rotas.get('/', async (req, res) => {
    res.json(await servico.listar())
})

rotas.get('/:id', async (req, res) => {
    res.json(await servico.buscar(Number(req.params.id)))
})

rotas.post('/', permitir(Papel.GESTOR_ALMOXARIFADO), async (req, res) => {
    res.status(201).json(await servico.criar(req.body))
})

rotas.post('/:id/equipamentos', permitir(Papel.GESTOR_ALMOXARIFADO), async (req, res) => {
    res.status(201).json(await servico.adicionarEquipamento(Number(req.params.id), req.body))
})

export default rotas
