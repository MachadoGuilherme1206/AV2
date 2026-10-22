export default class ErroApi extends Error {
    readonly status: number

    constructor(status: number, mensagem: string) {
        super(mensagem)
        this.status = status
    }
}
