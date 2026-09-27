export default class Endereco {
    readonly logradouro: string
    readonly numero: string
    readonly bairro: string
    readonly cidade: string
    readonly uf: string
    readonly cep: string

    constructor(
        logradouro: string,
        numero: string,
        bairro: string,
        cidade: string,
        uf: string,
        cep: string
    ) {
        this.logradouro = logradouro
        this.numero = numero
        this.bairro = bairro
        this.cidade = cidade
        this.uf = uf.toUpperCase()
        this.cep = cep.replace(/\D/g, '')
    }

    public mostrarEndereco(): string {
        return `${this.logradouro}, ${this.numero} - ${this.bairro}, ${this.cidade}/${this.uf} - CEP ${this.cepFormatado}`
    }

    public get cepFormatado(): string {
        if (this.cep.length !== 8) {
            return this.cep
        }
        return `${this.cep.substring(0, 5)}-${this.cep.substring(5)}`
    }
}
