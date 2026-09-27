import RepositorioEquipamento from '../repositorios/repositorio-equipamento'
import RepositorioMovimentacao from '../repositorios/repositorio-movimentacao'
import RepositorioLote from '../repositorios/repositorio-lote'
import RepositorioOrganizacao from '../repositorios/repositorio-organizacao'
import ValidadorDataLote from '../validadores/validador-data-lote'

export default class ServicoRastreabilidade {
    private readonly equipamentos: RepositorioEquipamento
    private readonly movimentacoes: RepositorioMovimentacao
    private readonly lotes: RepositorioLote
    private readonly organizacoes: RepositorioOrganizacao

    constructor(
        equipamentos: RepositorioEquipamento,
        movimentacoes: RepositorioMovimentacao,
        lotes: RepositorioLote,
        organizacoes: RepositorioOrganizacao
    ) {
        this.equipamentos = equipamentos
        this.movimentacoes = movimentacoes
        this.lotes = lotes
        this.organizacoes = organizacoes
    }

    public rastrear(codigoBarras: string): string[] {
        const equipamento = this.equipamentos.buscarPorCodigoBarras(codigoBarras)

        if (equipamento === undefined) {
            throw new Error(`Equipamento com codigo de barras '${codigoBarras}' nao encontrado.`)
        }

        const lote = this.lotes.buscarPorId(equipamento.loteId)
        const organizacao = lote === undefined ? undefined : this.organizacoes.buscarPorId(lote.organizacaoId)
        const historico = this.movimentacoes.historicoDe(equipamento.id)

        const linhas: string[] = []

        linhas.push('='.repeat(72))
        linhas.push(`RASTREABILIDADE DO EQUIPAMENTO ${equipamento.codigoBarras}`)
        linhas.push('='.repeat(72))
        linhas.push('')
        linhas.push('ORIGEM')

        if (organizacao === undefined) {
            linhas.push('  Organizacao nao localizada na base.')
        } else {
            linhas.push(`  ${organizacao.razaoSocialFormatada} (${organizacao.id})`)
            linhas.push(`  CNPJ ${organizacao.cnpjFormatado}`)
            linhas.push(`  ${organizacao.endereco.mostrarEndereco()}`)
        }

        linhas.push('')
        linhas.push('LOTE DE ENTRADA')

        if (lote === undefined) {
            linhas.push('  Lote nao localizado na base.')
        } else {
            linhas.push(`  ${lote.id} | NF ${lote.notaFiscal} | transportadora ${lote.transportadora}`)
            linhas.push(`  Entrada em ${ValidadorDataLote.texto(lote.dataEntrada)}`)
        }

        linhas.push('')
        linhas.push('EQUIPAMENTO')
        linhas.push(`  ${equipamento.categoria} ${equipamento.marca} ${equipamento.modelo}`)
        linhas.push(`  Estado fisico atual: ${equipamento.estadoLegivel}`)
        linhas.push(`  Status atual: ${equipamento.statusAtual}`)

        linhas.push('')
        linhas.push(`HISTORICO DE MOVIMENTACOES (${historico.length})`)

        if (historico.length === 0) {
            linhas.push('  Nenhuma movimentacao registrada ate o momento.')
        } else {
            let passo = 1
            for (const movimentacao of historico) {
                linhas.push(`  ${passo}. ${movimentacao.descrever()}`)
                passo++
            }
        }

        linhas.push('')
        linhas.push('='.repeat(72))

        return linhas
    }

    public resumoPorOrganizacao(organizacaoId: string): string[] {
        const organizacao = this.organizacoes.buscarPorId(organizacaoId)

        if (organizacao === undefined) {
            throw new Error(`Organizacao '${organizacaoId}' nao encontrada.`)
        }

        const lotes = this.lotes.listarPorOrganizacao(organizacao.id)
        const linhas: string[] = []

        linhas.push(`RESUMO - ${organizacao.razaoSocialFormatada} (${organizacao.id})`)
        linhas.push('-'.repeat(72))

        let totalItens = 0

        for (const lote of lotes) {
            const itens = this.equipamentos.listarPorLote(lote.id)

            totalItens += itens.length

            linhas.push(
                `  ${lote.id} | ${ValidadorDataLote.texto(lote.dataEntrada)} | ` +
                `NF ${lote.notaFiscal} | ${itens.length} itens`
            )
        }

        linhas.push('-'.repeat(72))
        linhas.push(`  TOTAL: ${lotes.length} lotes | ${totalItens} itens`)

        return linhas
    }
}
