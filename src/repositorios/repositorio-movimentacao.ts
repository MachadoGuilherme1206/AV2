import RepositorioArquivo, { RegistroBruto } from './repositorio-arquivo'
import Movimentacao from '../classes/movimentacao'
import { StatusEquipamento } from '../tipos/status-equipamento'

export default class RepositorioMovimentacao extends RepositorioArquivo {
    public override get nomeArquivo(): string {
        return 'movimentacoes.enc'
    }

    public registrar(movimentacao: Movimentacao): void {
        const registros = this.lerRegistros()
        registros.push(RepositorioMovimentacao.paraRegistro(movimentacao))
        this.salvarRegistros(registros)
    }

    public historicoDe(equipamentoId: string): Movimentacao[] {
        return this.lerRegistros()
            .filter((registro) => registro.equipamentoId === equipamentoId)
            .map((registro) => RepositorioMovimentacao.deRegistro(registro))
            .sort((uma, outra) => uma.dataHora.getTime() - outra.dataHora.getTime())
    }

    public listar(): Movimentacao[] {
        return this.lerRegistros().map((registro) => RepositorioMovimentacao.deRegistro(registro))
    }

    private static paraRegistro(movimentacao: Movimentacao): RegistroBruto {
        return {
            id: movimentacao.id,
            equipamentoId: movimentacao.equipamentoId,
            codigoBarras: movimentacao.codigoBarras,
            de: movimentacao.de,
            para: movimentacao.para,
            usuarioLogin: movimentacao.usuarioLogin,
            dataHora: movimentacao.dataHora.toISOString(),
            justificativa: movimentacao.justificativa
        }
    }

    private static deRegistro(registro: RegistroBruto): Movimentacao {
        return new Movimentacao(
            registro.id,
            registro.equipamentoId,
            registro.codigoBarras,
            registro.de as StatusEquipamento,
            registro.para as StatusEquipamento,
            registro.usuarioLogin,
            registro.justificativa,
            new Date(registro.dataHora)
        )
    }
}
