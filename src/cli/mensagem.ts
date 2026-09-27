import { Severidade, prefixoDaSeveridade } from '../tipos/severidade'

export default class Mensagem {
    readonly severidade: Severidade
    readonly texto: string

    constructor(severidade: Severidade, texto: string) {
        this.severidade = severidade
        this.texto = texto
    }

    public formatar(): string {
        return `${prefixoDaSeveridade(this.severidade)} ${this.texto}`
    }

    public imprimir(): void {
        const saida = this.severidade === Severidade.ERRO || this.severidade === Severidade.CRITICO
            ? console.error
            : console.log

        saida(this.formatar())
    }

    public static sucesso(texto: string): Mensagem {
        return new Mensagem(Severidade.SUCESSO, texto)
    }

    public static info(texto: string): Mensagem {
        return new Mensagem(Severidade.INFO, texto)
    }

    public static aviso(texto: string): Mensagem {
        return new Mensagem(Severidade.AVISO, texto)
    }

    public static erro(texto: string): Mensagem {
        return new Mensagem(Severidade.ERRO, texto)
    }

    public static critico(texto: string): Mensagem {
        return new Mensagem(Severidade.CRITICO, texto)
    }
}
