import * as fs from 'node:fs'
import * as path from 'node:path'
import { ARQUIVO_JOURNAL, PASTA_LOGS, prepararPastas } from '../util/caminhos'

export default class ServicoJournal {
    public static readonly TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024
    public static readonly RETENCAO_DIAS = 180

    private readonly caminho: string

    constructor(caminho: string = ARQUIVO_JOURNAL) {
        this.caminho = caminho
        prepararPastas()
    }

    public registrar(acao: string, usuarioLogin: string, detalhe: string = ''): void {
        this.rotacionarSeNecessario()

        const linha = `${new Date().toISOString()} | ${usuarioLogin} | ${acao} | ${detalhe}\n`
        fs.appendFileSync(this.caminho, linha, 'utf8')
    }

    public rotacionarSeNecessario(): void {
        if (!fs.existsSync(this.caminho)) {
            return
        }

        const tamanho = fs.statSync(this.caminho).size

        if (tamanho <= ServicoJournal.TAMANHO_MAXIMO_BYTES) {
            return
        }

        const carimbo = new Date().toISOString().replace(/[:.]/g, '-')
        const destino = path.join(PASTA_LOGS, `journal-${carimbo}.log`)

        fs.renameSync(this.caminho, destino)
        fs.writeFileSync(this.caminho, '', 'utf8')
    }

    public limparAntigos(dias: number = ServicoJournal.RETENCAO_DIAS): number {
        if (!fs.existsSync(PASTA_LOGS)) {
            return 0
        }

        const limite = new Date()
        limite.setDate(limite.getDate() - dias)

        let removidos = 0

        for (const nome of fs.readdirSync(PASTA_LOGS)) {
            if (!nome.startsWith('journal-') || !nome.endsWith('.log')) {
                continue
            }

            const completo = path.join(PASTA_LOGS, nome)

            if (fs.statSync(completo).mtime.getTime() < limite.getTime()) {
                fs.unlinkSync(completo)
                removidos++
            }
        }

        return removidos
    }

    public listar(filtro: string = '', limite: number = 50): string[] {
        if (!fs.existsSync(this.caminho)) {
            return []
        }

        const linhas = fs.readFileSync(this.caminho, 'utf8')
            .split('\n')
            .filter((linha) => linha.trim() !== '')
            .filter((linha) => filtro === '' || linha.toLowerCase().includes(filtro.toLowerCase()))

        return linhas.slice(-limite)
    }

    public get caminhoArquivo(): string {
        return this.caminho
    }
}
