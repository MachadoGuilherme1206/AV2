import Validador from './validador'
import ResultadoValidacao from './resultado-validacao'
import { EstadoFisico, nomeDoEstado } from '../tipos/estado-fisico'

export type AlteracaoDeEstado = {
    novoEstado: EstadoFisico
    justificativa: string
}

export default class ValidadorQuedaEstado extends Validador {
    private static readonly QUEDA_CRITICA = 2
    private static readonly MINIMO_CARACTERES = 10

    private readonly estadoAnterior: EstadoFisico

    constructor(estadoAnterior: EstadoFisico) {
        super('Queda de estado fisico')
        this.estadoAnterior = estadoAnterior
    }

    public validar(valor: unknown): ResultadoValidacao {
        const alteracao = valor as AlteracaoDeEstado
        const queda = this.estadoAnterior - alteracao.novoEstado

        if (queda < ValidadorQuedaEstado.QUEDA_CRITICA) {
            return this.sucesso()
        }

        const justificativa = alteracao.justificativa.trim()

        if (justificativa.length < ValidadorQuedaEstado.MINIMO_CARACTERES) {
            return this.falha(
                `Queda de ${nomeDoEstado(this.estadoAnterior)} para ${nomeDoEstado(alteracao.novoEstado)} ` +
                `exige justificativa com no minimo ${ValidadorQuedaEstado.MINIMO_CARACTERES} caracteres.`
            )
        }

        return this.sucesso()
    }

    public exigeJustificativa(novoEstado: EstadoFisico): boolean {
        return this.estadoAnterior - novoEstado >= ValidadorQuedaEstado.QUEDA_CRITICA
    }
}
