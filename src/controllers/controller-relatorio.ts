import { Router } from 'express'
import * as servicoRelatorio from '../services/servico-relatorio'
import * as servicoEquipamento from '../services/servico-equipamento'
import { autenticar } from '../middlewares/autenticacao'

const rotas = Router()

rotas.use(autenticar)

rotas.get('/organizacoes/:id', async (req, res) => {
    res.json(await servicoRelatorio.resumoOrganizacao(Number(req.params.id)))
})

rotas.get('/rastreio/:codigo', async (req, res) => {
    res.json(await servicoEquipamento.rastrear(req.params.codigo))
})

export default rotas
