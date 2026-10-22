import { StatusEquipamento } from '@prisma/client'
import * as repositorioEquipamento from '../repositories/repositorio-equipamento'
import { buscar as buscarOrganizacao } from './servico-organizacao'
import { calcularValores } from './servico-equipamento'

const resumoOrganizacao = async (organizacaoId: number) => {
    const organizacao = await buscarOrganizacao(organizacaoId)
    const equipamentos = await repositorioEquipamento.listarPorOrganizacao(organizacaoId)

    const porStatus: Record<string, number> = {}
    for (const status of Object.values(StatusEquipamento)) {
        porStatus[status] = 0
    }

    let valorAtualTotal = 0
    let impostosTotal = 0

    for (const equipamento of equipamentos) {
        porStatus[equipamento.status]++

        const valores = await calcularValores(Number(equipamento.valor), equipamento.lote.dataEntrada)
        valorAtualTotal += valores.valorAtual
        impostosTotal += valores.impostos
    }

    return {
        organizacao: {
            id: organizacao.id,
            razaoSocial: organizacao.razaoSocial,
            cnpj: organizacao.cnpj,
            contrato: organizacao.contrato?.numero ?? null
        },
        totalLotes: organizacao.lotes.length,
        totalEquipamentos: equipamentos.length,
        porStatus,
        valorAtualTotal: Number(valorAtualTotal.toFixed(2)),
        impostosTotal: Number(impostosTotal.toFixed(2))
    }
}

export {
    resumoOrganizacao
}
