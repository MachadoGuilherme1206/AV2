import Validador from './validador'
import ResultadoValidacao from './resultado-validacao'

export default class ValidadorDataLote extends Validador {
    private static readonly LIMITE_DIAS = 90

    constructor() {
        super('Data de entrada do lote')
    }

    public validar(valor: unknown): ResultadoValidacao {
        if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) {
            return this.falha('Data de entrada invalida. Use o formato AAAA-MM-DD.')
        }

        const informada = ValidadorDataLote.semHoras(valor)
        const hoje = ValidadorDataLote.semHoras(new Date())

        if (informada.getTime() > hoje.getTime()) {
            return this.falha(
                `Data de entrada nao pode ser futura. Informada: ${ValidadorDataLote.texto(informada)}.`
            )
        }

        const limite = ValidadorDataLote.semHoras(new Date())
        limite.setDate(limite.getDate() - ValidadorDataLote.LIMITE_DIAS)

        if (informada.getTime() < limite.getTime()) {
            return this.falha(
                `Data de entrada excede o limite de ${ValidadorDataLote.LIMITE_DIAS} dias. ` +
                `Limite: ${ValidadorDataLote.texto(limite)}.`
            )
        }

        return this.sucesso()
    }

    private static semHoras(data: Date): Date {
        return new Date(data.getFullYear(), data.getMonth(), data.getDate())
    }

    public static texto(data: Date): string {
        const ano = data.getFullYear()
        const mes = String(data.getMonth() + 1).padStart(2, '0')
        const dia = String(data.getDate()).padStart(2, '0')
        return `${ano}-${mes}-${dia}`
    }

    public static converter(texto: string): Date {
        const partes = texto.trim().split('-')

        if (partes.length !== 3) {
            return new Date(NaN)
        }

        return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
    }
}
