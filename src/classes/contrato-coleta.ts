import ValidadorDataLote from '../validadores/validador-data-lote'

export default class ContratoColeta {
    readonly numero: string
    readonly dataInicio: Date
    readonly dataFim: Date
    readonly periodicidadeDias: number

    constructor(numero: string, dataInicio: Date, dataFim: Date, periodicidadeDias: number) {
        this.numero = numero
        this.dataInicio = dataInicio
        this.dataFim = dataFim
        this.periodicidadeDias = periodicidadeDias
    }

    public vigente(data: Date = new Date()): boolean {
        return data.getTime() >= this.dataInicio.getTime() &&
            data.getTime() <= this.dataFim.getTime()
    }

    public descrever(): string {
        const situacao = this.vigente() ? 'vigente' : 'encerrado'
        const inicio = ValidadorDataLote.texto(this.dataInicio)
        const fim = ValidadorDataLote.texto(this.dataFim)
        return `Contrato ${this.numero} (${inicio} a ${fim}, coleta a cada ${this.periodicidadeDias} dias) - ${situacao}`
    }
}
