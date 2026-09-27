import RepositorioArquivo, { RegistroBruto } from './repositorio-arquivo'
import Lote from '../classes/lote'

export default class RepositorioLote extends RepositorioArquivo {
    public override get nomeArquivo(): string {
        return 'lotes.enc'
    }

    public salvar(lote: Lote): void {
        const registros = this.lerRegistros()
        const posicao = registros.findIndex((registro) => registro.id === lote.id)
        const novo = RepositorioLote.paraRegistro(lote)

        if (posicao >= 0) {
            registros[posicao] = novo
        } else {
            registros.push(novo)
        }

        this.salvarRegistros(registros)
    }

    public buscarPorId(id: string): Lote | undefined {
        const registro = this.lerRegistros()
            .find((item) => item.id === id.trim().toUpperCase())

        return registro === undefined ? undefined : RepositorioLote.deRegistro(registro)
    }

    public listar(): Lote[] {
        return this.lerRegistros().map((registro) => RepositorioLote.deRegistro(registro))
    }

    public listarPorOrganizacao(organizacaoId: string): Lote[] {
        return this.lerRegistros()
            .filter((registro) => registro.organizacaoId === organizacaoId.trim().toUpperCase())
            .map((registro) => RepositorioLote.deRegistro(registro))
    }

    private static paraRegistro(lote: Lote): RegistroBruto {
        return {
            id: lote.id,
            organizacaoId: lote.organizacaoId,
            notaFiscal: lote.notaFiscal,
            transportadora: lote.transportadora,
            dataEntrada: lote.dataEntrada.toISOString()
        }
    }

    private static deRegistro(registro: RegistroBruto): Lote {
        return new Lote(
            registro.id,
            registro.organizacaoId,
            registro.notaFiscal,
            registro.transportadora,
            new Date(registro.dataEntrada)
        )
    }
}
