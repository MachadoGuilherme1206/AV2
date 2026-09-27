import { StatusEquipamento } from '../tipos/status-equipamento'

export default class Movimentacao {
    readonly id: string
    readonly equipamentoId: string
    readonly codigoBarras: string
    readonly de: StatusEquipamento
    readonly para: StatusEquipamento
    readonly usuarioLogin: string
    readonly dataHora: Date
    readonly justificativa: string

    constructor(
        id: string,
        equipamentoId: string,
        codigoBarras: string,
        de: StatusEquipamento,
        para: StatusEquipamento,
        usuarioLogin: string,
        justificativa: string = '',
        dataHora?: Date
    ) {
        this.id = id
        this.equipamentoId = equipamentoId
        this.codigoBarras = codigoBarras
        this.de = de
        this.para = para
        this.usuarioLogin = usuarioLogin

        this.dataHora = dataHora ?? new Date()
        this.justificativa = justificativa
    }

    public descrever(): string {
        const quando = this.dataHora.toISOString()
        const motivo = this.justificativa === '' ? '' : ` | motivo: ${this.justificativa}`
        return `${quando} | ${this.de} -> ${this.para} | por ${this.usuarioLogin}${motivo}`
    }
}
