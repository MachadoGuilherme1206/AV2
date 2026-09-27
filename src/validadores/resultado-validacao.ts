export default class ResultadoValidacao {
    readonly valido: boolean
    readonly mensagem: string

    constructor(valido: boolean, mensagem: string) {
        this.valido = valido
        this.mensagem = mensagem
    }
}
