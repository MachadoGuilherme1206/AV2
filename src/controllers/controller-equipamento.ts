import { Router } from 'express'
import { Papel } from '@prisma/client'
import * as servico from '../services/servico-equipamento'
import { autenticar, permitir } from '../middlewares/autenticacao'

const rotas = Router()

rotas.use(autenticar)

rotas.get('/', async (req, res) => {
    const { status, loteId } = req.query
    res.json(await servico.listar(status as string, loteId as string))
})

rotas.get('/:id', async (req, res) => {
    res.json(await servico.buscar(Number(req.params.id)))
})

rotas.patch('/:id/triagem', permitir(Papel.GESTOR_ALMOXARIFADO), async (req, res) => {
    res.json(await servico.triar(Number(req.params.id), req.body, req.usuario!.id))
})

rotas.patch('/:id/status', permitir(Papel.GESTOR_ALMOXARIFADO), async (req, res) => {
    res.json(await servico.mover(Number(req.params.id), req.body, req.usuario!.id))
})

rotas.patch('/:id/estado', permitir(Papel.GESTOR_ALMOXARIFADO), async (req, res) => {
    res.json(await servico.alterarEstado(Number(req.params.id), req.body))
})

export default rotas
