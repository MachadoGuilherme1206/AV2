import ErroApi from '../erro-api'
import * as repositorio from '../repositories/repositorio-configuracao'

// Parametros globais que o administrador pode alterar (em porcentagem).
const padroes: Record<string, number> = {
    'aliquota.icms': 18,
    'aliquota.iss': 5,
    'depreciacao.mensal': 2.5
}

const listar = async () => {
    const valores = { ...padroes }

    for (const configuracao of await repositorio.listar()) {
        valores[configuracao.chave] = Number(configuracao.valor)
    }
    return valores
}

const definir = async (chave: string, valor: any) => {
    if (!(chave in padroes)) {
        throw new ErroApi(400, `Chave desconhecida. Use: ${Object.keys(padroes).join(', ')}.`)
    }

    const numero = Number(valor)
    if (Number.isNaN(numero) || numero < 0 || numero > 100) {
        throw new ErroApi(400, 'O valor deve ser uma porcentagem entre 0 e 100.')
    }

    await repositorio.definir(chave, String(numero))
    return listar()
}

export {
    padroes,
    listar,
    definir
}
