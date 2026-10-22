import { Router } from 'express'
import * as servico from '../services/servico-autenticacao'

const rotas = Router()

rotas.post('/login', async (req, res) => {
    const { login, senha } = req.body ?? {}
    const resultado = await servico.login(login, senha)
    res.json(resultado)
})

export default rotas
