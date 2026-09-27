import ResultadoValidacao from './resultado-validacao'

export interface Validavel {
    validar(valor: unknown): ResultadoValidacao
}

export default abstract class Validador implements Validavel {
    protected readonly nome: string

    constructor(nome: string) {
        this.nome = nome
    }

    public abstract validar(valor: unknown): ResultadoValidacao

    public validarOuFalhar(valor: unknown): void {
        const resultado = this.validar(valor)

        if (!resultado.valido) {
            throw new Error(resultado.mensagem)
        }
    }

    protected sucesso(): ResultadoValidacao {
        return new ResultadoValidacao(true, '')
    }

    protected falha(mensagem: string): ResultadoValidacao {
        return new ResultadoValidacao(false, mensagem)
    }

    public descrever(): string {
        return `Validador: ${this.nome}`
    }
}
