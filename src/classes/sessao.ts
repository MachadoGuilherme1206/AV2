import Usuario from './usuario'

export default class Sessao {
    public static readonly MINUTOS_INATIVIDADE = 30

    readonly usuario: Usuario
    readonly iniciadaEm: Date
    private ultimaAtividade: Date

    constructor(usuario: Usuario) {
        this.usuario = usuario
        this.iniciadaEm = new Date()
        this.ultimaAtividade = new Date()
    }

    public renovar(): void {
        this.ultimaAtividade = new Date()
    }

    public expirada(): boolean {
        return this.minutosParados() >= Sessao.MINUTOS_INATIVIDADE
    }

    public minutosRestantes(): number {
        const restante = Sessao.MINUTOS_INATIVIDADE - this.minutosParados()
        return restante > 0 ? Math.floor(restante) : 0
    }

    public pertoDeExpirar(): boolean {
        return !this.expirada() && this.minutosRestantes() <= 5
    }

    private minutosParados(): number {
        const decorridoMs = new Date().getTime() - this.ultimaAtividade.getTime()
        return decorridoMs / 1000 / 60
    }

    public descrever(): string {
        return `${this.usuario.descrever()} | sessao expira em ${this.minutosRestantes()} min`
    }
}
