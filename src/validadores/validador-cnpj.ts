import Validador from './validador'
import ResultadoValidacao from './resultado-validacao'

export default class ValidadorCNPJ extends Validador {
    private static readonly PESOS_PRIMEIRO = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    private static readonly PESOS_SEGUNDO = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    constructor() {
        super('CNPJ')
    }

    public validar(valor: unknown): ResultadoValidacao {
        if (typeof valor !== 'string') {
            return this.falha('CNPJ deve ser informado como texto.')
        }

        const digitos = ValidadorCNPJ.apenasDigitos(valor)

        if (digitos.length !== 14) {
            return this.falha(`CNPJ deve conter 14 digitos. Informados: ${digitos.length}.`)
        }

        if (ValidadorCNPJ.todosIguais(digitos)) {
            return this.falha('CNPJ invalido: sequencia de digitos repetidos.')
        }

        const base = digitos.substring(0, 12)
        const primeiro = this.calcularDigito(base, ValidadorCNPJ.PESOS_PRIMEIRO)
        const segundo = this.calcularDigito(base + primeiro, ValidadorCNPJ.PESOS_SEGUNDO)
        const verificadores = `${primeiro}${segundo}`

        if (digitos.substring(12) !== verificadores) {
            return this.falha('CNPJ invalido: digitos verificadores nao conferem.')
        }

        return this.sucesso()
    }

    private calcularDigito(base: string, pesos: number[]): number {
        let soma = 0

        for (let posicao = 0; posicao < pesos.length; posicao++) {
            soma += Number(base.charAt(posicao)) * pesos[posicao]
        }

        const resto = soma % 11
        return resto < 2 ? 0 : 11 - resto
    }

    public static apenasDigitos(cnpj: string): string {
        return cnpj.replace(/\D/g, '')
    }

    public static formatar(cnpj: string): string {
        const digitos = ValidadorCNPJ.apenasDigitos(cnpj)

        if (digitos.length !== 14) {
            return cnpj
        }

        return `${digitos.substring(0, 2)}.${digitos.substring(2, 5)}.${digitos.substring(5, 8)}` +
            `/${digitos.substring(8, 12)}-${digitos.substring(12)}`
    }

    private static todosIguais(digitos: string): boolean {
        return digitos.split('').every((digito) => digito === digitos.charAt(0))
    }
}
