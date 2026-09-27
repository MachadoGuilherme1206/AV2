import * as fs from 'node:fs'
import ServicoCriptografia from '../servicos/servico-criptografia'
import { arquivoDeDados, prepararPastas } from '../util/caminhos'

export type RegistroBruto = Record<string, any>

export default abstract class RepositorioArquivo {
    protected readonly cripto: ServicoCriptografia

    constructor(cripto: ServicoCriptografia) {
        this.cripto = cripto
        prepararPastas()
    }

    public abstract get nomeArquivo(): string

    protected get caminho(): string {
        return arquivoDeDados(this.nomeArquivo)
    }

    protected lerRegistros(): RegistroBruto[] {
        if (!fs.existsSync(this.caminho)) {
            return []
        }

        const conteudo = fs.readFileSync(this.caminho, 'utf8').trim()

        if (conteudo === '') {
            return []
        }

        try {
            return JSON.parse(this.cripto.decifrar(conteudo)) as RegistroBruto[]
        } catch (erro) {
            const motivo = erro instanceof Error ? erro.message : String(erro)
            throw new Error(
                `Falha ao ler ${this.nomeArquivo}: arquivo corrompido ou chave mestra incorreta. (${motivo})`
            )
        }
    }

    protected salvarRegistros(registros: RegistroBruto[]): void {
        const conteudo = this.cripto.cifrar(JSON.stringify(registros, null, 0))
        this.escreverAtomico(conteudo)
    }

    private escreverAtomico(conteudo: string): void {
        const temporario = `${this.caminho}.tmp`

        fs.writeFileSync(temporario, conteudo, 'utf8')
        fs.renameSync(temporario, this.caminho)
    }

    public quantidade(): number {
        return this.lerRegistros().length
    }
}
