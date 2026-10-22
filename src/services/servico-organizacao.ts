import ErroApi from '../erro-api'
import ValidadorCNPJ from '../validadores/validador-cnpj'
import ValidadorDataLote from '../validadores/validador-data-lote'
import * as repositorio from '../repositories/repositorio-organizacao'

const camposObrigatorios = ['razaoSocial', 'nomeFantasia', 'cnpj', 'logradouro', 'numero', 'bairro', 'cidade', 'uf', 'cep']

const criar = async (dados: any) => {
    for (const campo of camposObrigatorios) {
        if (!dados?.[campo] || String(dados[campo]).trim() === '') {
            throw new ErroApi(400, `Campo obrigatorio: ${campo}.`)
        }
    }

    const resultado = new ValidadorCNPJ().validar(dados.cnpj)
    if (!resultado.valido) {
        throw new ErroApi(400, resultado.mensagem)
    }

    return repositorio.criar({
        razaoSocial: String(dados.razaoSocial).trim().toUpperCase(),
        nomeFantasia: String(dados.nomeFantasia).trim(),
        cnpj: ValidadorCNPJ.apenasDigitos(dados.cnpj),
        logradouro: dados.logradouro,
        numero: String(dados.numero),
        bairro: dados.bairro,
        cidade: dados.cidade,
        uf: String(dados.uf).toUpperCase(),
        cep: String(dados.cep).replace(/\D/g, '')
    })
}

const listar = async () => {
    return repositorio.listar()
}

const buscar = async (id: number) => {
    const organizacao = await repositorio.buscarPorId(id)

    if (!organizacao) {
        throw new ErroApi(404, 'Organizacao nao encontrada.')
    }
    return organizacao
}

// Cada organizacao tem no maximo um contrato: se ja existir, ele e atualizado.
const salvarContrato = async (organizacaoId: number, dados: any) => {
    await buscar(organizacaoId)

    if (!dados?.numero) {
        throw new ErroApi(400, 'Campo obrigatorio: numero.')
    }

    const dataInicio = ValidadorDataLote.converter(String(dados.dataInicio ?? ''))
    const dataFim = ValidadorDataLote.converter(String(dados.dataFim ?? ''))

    if (Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataFim.getTime())) {
        throw new ErroApi(400, 'Datas invalidas. Use o formato AAAA-MM-DD.')
    }

    if (dataFim.getTime() <= dataInicio.getTime()) {
        throw new ErroApi(400, 'A data de fim deve ser depois da data de inicio.')
    }

    const periodicidadeDias = Number(dados.periodicidadeDias)
    if (!Number.isInteger(periodicidadeDias) || periodicidadeDias <= 0) {
        throw new ErroApi(400, 'periodicidadeDias deve ser um numero inteiro maior que zero.')
    }

    const contrato = { numero: String(dados.numero), dataInicio, dataFim, periodicidadeDias }
    const existente = await repositorio.buscarContrato(organizacaoId)

    if (!existente) {
        return repositorio.criarContrato({ ...contrato, organizacaoId })
    }

    const alterados = await repositorio.atualizarContrato(existente.id, Number(dados.versao), contrato)
    if (alterados === 0) {
        throw new ErroApi(409, 'O contrato foi alterado por outra pessoa (versao diferente). Consulte de novo e tente outra vez.')
    }
    return repositorio.buscarContrato(organizacaoId)
}

export {
    criar,
    listar,
    buscar,
    salvarContrato
}
