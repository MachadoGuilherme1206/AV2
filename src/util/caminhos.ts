import * as path from 'node:path'
import * as fs from 'node:fs'

const RAIZ = process.cwd()

export const PASTA_CONFIG = path.join(RAIZ, 'config')
export const PASTA_DADOS = path.join(RAIZ, 'data')
export const PASTA_LOGS = path.join(RAIZ, 'logs')

export const ARQUIVO_CHAVE = path.join(PASTA_CONFIG, 'master.key')
export const ARQUIVO_JOURNAL = path.join(PASTA_LOGS, 'journal.log')
export const ARQUIVO_HISTORICO_CLI = path.join(PASTA_LOGS, 'historico_cli.txt')

export function arquivoDeDados(nome: string): string {
    return path.join(PASTA_DADOS, nome)
}

export function prepararPastas(): void {
    for (const pasta of [PASTA_CONFIG, PASTA_DADOS, PASTA_LOGS]) {
        if (!fs.existsSync(pasta)) {
            fs.mkdirSync(pasta, { recursive: true })
        }
    }
}
