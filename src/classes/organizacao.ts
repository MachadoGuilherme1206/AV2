import Endereco from './endereco'
import ContratoColeta from './contrato-coleta'
import ValidadorCNPJ from '../validadores/validador-cnpj'

export default class Organizacao {
    readonly id: string
    private razaoSocial: string
    public nomeFantasia: string
    private cnpj: string
    public endereco: Endereco
    private contratos: ContratoColeta[]

    constructor(
        id: string,
        razaoSocial: string,
        nomeFantasia: string,
        cnpj: string,
        endereco: Endereco
    ) {
        this.id = id
        this.razaoSocial = razaoSocial.toUpperCase()
        this.nomeFantasia = nomeFantasia
        this.cnpj = ValidadorCNPJ.apenasDigitos(cnpj)
        this.endereco = endereco
        this.contratos = []
    }

    public get razaoSocialFormatada(): string {
        return this.razaoSocial.toUpperCase()
    }

    public set alterarRazaoSocial(valor: string) {
        this.razaoSocial = valor.trim().toUpperCase()
    }

    public get cnpjLimpo(): string {
        return this.cnpj
    }

    public get cnpjFormatado(): string {
        return ValidadorCNPJ.formatar(this.cnpj)
    }

    public set alterarCnpj(valor: string) {
        new ValidadorCNPJ().validarOuFalhar(valor)
        this.cnpj = ValidadorCNPJ.apenasDigitos(valor)
    }

    public adicionarContrato(contrato: ContratoColeta): void {
        this.contratos.push(contrato)
    }

    public contratoVigente(): ContratoColeta | undefined {
        return this.contratos.find((contrato) => contrato.vigente())
    }

    public listarContratos(): ContratoColeta[] {
        return [...this.contratos]
    }

    public descrever(): string {
        const contrato = this.contratoVigente()
        const situacao = contrato === undefined ? 'sem contrato vigente' : `contrato ${contrato.numero}`
        return `${this.id} | ${this.razaoSocialFormatada} | ${this.cnpjFormatado} | ${situacao}`
    }
}
