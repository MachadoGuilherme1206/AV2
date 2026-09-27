export default class ComandoAnalisado {
    readonly acao: string
    readonly subacao: string
    readonly posicionais: string[]
    private readonly opcoes: Map<string, string>

    constructor(acao: string, subacao: string, posicionais: string[], opcoes: Map<string, string>) {
        this.acao = acao
        this.subacao = subacao
        this.posicionais = posicionais
        this.opcoes = opcoes
    }

    public get comandoCompleto(): string {
        return this.subacao === '' ? this.acao : `${this.acao} ${this.subacao}`
    }

    public get vazio(): boolean {
        return this.acao === ''
    }

    public opcao(nome: string, padrao: string = ''): string {
        return this.opcoes.get(nome) ?? padrao
    }

    public temOpcao(nome: string): boolean {
        return this.opcoes.has(nome)
    }

    public opcaoObrigatoria(nome: string): string {
        const valor = this.opcoes.get(nome)

        if (valor === undefined || valor.trim() === '') {
            throw new Error(`Parametro obrigatorio ausente: --${nome}`)
        }

        return valor
    }

    public posicional(indice: number, padrao: string = ''): string {
        return this.posicionais[indice] ?? padrao
    }

    public posicionalObrigatorio(indice: number, nome: string): string {
        const valor = this.posicionais[indice]

        if (valor === undefined || valor.trim() === '') {
            throw new Error(`Argumento obrigatorio ausente: ${nome}`)
        }

        return valor
    }
}
