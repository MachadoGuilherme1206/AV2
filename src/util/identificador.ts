import { randomBytes } from 'node:crypto'

export function gerarId(prefixo: string): string {
    const tempo = Date.now().toString(36).toUpperCase()
    const aleatorio = randomBytes(2).toString('hex').toUpperCase()
    return `${prefixo}-${tempo}-${aleatorio}`
}

export function gerarIdSequencial(prefixo: string, quantidadeExistente: number): string {
    const proximo = quantidadeExistente + 1
    return `${prefixo}${String(proximo).padStart(3, '0')}`
}
