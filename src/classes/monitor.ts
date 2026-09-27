import Equipamento from './equipamento'

export default class Monitor extends Equipamento {
    readonly polegadas: number
    readonly tecnologia: string

    constructor(
        id: string,
        codigoBarras: string,
        loteId: string,
        marca: string,
        modelo: string,
        polegadas: number,
        tecnologia: string
    ) {
        super(id, codigoBarras, loteId, marca, modelo)
        this.polegadas = polegadas
        this.tecnologia = tecnologia.toUpperCase()
    }

    public override get categoria(): string {
        return 'MONITOR'
    }

    public get ehTuboDeRaios(): boolean {
        return this.tecnologia === 'CRT'
    }

    public override descrever(): string {
        const aviso = this.ehTuboDeRaios ? ' | contem chumbo' : ''
        return `${super.descrever()} | ${this.polegadas}" ${this.tecnologia}${aviso}`
    }
}
