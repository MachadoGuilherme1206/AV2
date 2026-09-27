import RepositorioArquivo, { RegistroBruto } from './repositorio-arquivo'

export default class RepositorioConfiguracao extends RepositorioArquivo {
    private static readonly PADROES: Record<string, string> = {
        'aliquota.icms': '18.0',
        'aliquota.iss': '5.0',
        'depreciacao.mensal': '2.5',
        'moeda': 'BRL'
    }

    public override get nomeArquivo(): string {
        return 'configuracao.enc'
    }

    public definir(chave: string, valor: string): void {
        const registros = this.lerRegistros()
        const posicao = registros.findIndex((registro) => registro.chave === chave)

        const novo: RegistroBruto = { chave, valor }

        if (posicao >= 0) {
            registros[posicao] = novo
        } else {
            registros.push(novo)
        }

        this.salvarRegistros(registros)
    }

    public obter(chave: string): string {
        const registro = this.lerRegistros().find((item) => item.chave === chave)

        if (registro !== undefined) {
            return registro.valor
        }

        return RepositorioConfiguracao.PADROES[chave] ?? ''
    }

    public listarTudo(): Map<string, string> {
        const resultado = new Map<string, string>()

        for (const chave of Object.keys(RepositorioConfiguracao.PADROES)) {
            resultado.set(chave, RepositorioConfiguracao.PADROES[chave])
        }

        for (const registro of this.lerRegistros()) {
            resultado.set(registro.chave, registro.valor)
        }

        return resultado
    }

    public chavesConhecidas(): string[] {
        return Object.keys(RepositorioConfiguracao.PADROES)
    }
}
