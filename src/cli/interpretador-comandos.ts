import ComandoAnalisado from './comando-analisado'

export default class InterpretadorComandos {
    private static readonly ACOES_COM_SUBACAO = [
        'usuario', 'config', 'org', 'contrato', 'lote', 'equip', 'relatorio', 'journal'
    ]

    public analisar(linha: string): ComandoAnalisado {
        const partes = this.separarEmPartes(linha)

        if (partes.length === 0) {
            return new ComandoAnalisado('', '', [], new Map())
        }

        const acao = partes[0].toLowerCase()
        const resto = partes.slice(1)

        let subacao = ''
        let inicioDosDemais = 0

        if (
            InterpretadorComandos.ACOES_COM_SUBACAO.includes(acao) &&
            resto.length > 0 &&
            !resto[0].startsWith('--')
        ) {
            subacao = resto[0].toLowerCase()
            inicioDosDemais = 1
        }

        const { posicionais, opcoes } = this.extrairOpcoes(resto.slice(inicioDosDemais))

        return new ComandoAnalisado(acao, subacao, posicionais, opcoes)
    }

    private separarEmPartes(linha: string): string[] {
        const partes: string[] = []
        let atual = ''
        let dentroDeAspas = false

        for (const caractere of linha.trim()) {
            if (caractere === '"') {
                dentroDeAspas = !dentroDeAspas
                continue
            }

            if (caractere === ' ' && !dentroDeAspas) {
                if (atual !== '') {
                    partes.push(atual)
                    atual = ''
                }
                continue
            }

            atual += caractere
        }

        if (atual !== '') {
            partes.push(atual)
        }

        return partes
    }

    private extrairOpcoes(partes: string[]): { posicionais: string[]; opcoes: Map<string, string> } {
        const posicionais: string[] = []
        const opcoes = new Map<string, string>()

        let indice = 0

        while (indice < partes.length) {
            const parte = partes[indice]

            if (parte.startsWith('--')) {
                const nome = parte.substring(2).toLowerCase()
                const proximo = partes[indice + 1]

                if (proximo !== undefined && !proximo.startsWith('--')) {
                    opcoes.set(nome, proximo)
                    indice += 2
                } else {
                    opcoes.set(nome, 'sim')
                    indice += 1
                }
            } else {
                posicionais.push(parte)
                indice += 1
            }
        }

        return { posicionais, opcoes }
    }
}
