import Equipamento from './equipamento'

export default class Computador extends Equipamento {
    readonly processador: string
    readonly memoriaGb: number
    readonly temHd: boolean

    constructor(
        id: string,
        codigoBarras: string,
        loteId: string,
        marca: string,
        modelo: string,
        processador: string,
        memoriaGb: number,
        temHd: boolean
    ) {
        super(id, codigoBarras, loteId, marca, modelo)
        this.processador = processador
        this.memoriaGb = memoriaGb
        this.temHd = temHd
    }

    public override get categoria(): string {
        return 'COMPUTADOR'
    }

    public override descrever(): string {
        const hd = this.temHd ? 'com HD' : 'sem HD'
        return `${super.descrever()} | ${this.processador}, ${this.memoriaGb}GB, ${hd}`
    }
}
