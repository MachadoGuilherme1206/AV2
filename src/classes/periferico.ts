import Equipamento from './equipamento'

export default class Periferico extends Equipamento {
    readonly tipo: string

    constructor(
        id: string,
        codigoBarras: string,
        loteId: string,
        marca: string,
        modelo: string,
        tipo: string
    ) {
        super(id, codigoBarras, loteId, marca, modelo)
        this.tipo = tipo.toUpperCase()
    }

    public override get categoria(): string {
        return 'PERIFERICO'
    }

    public override descrever(): string {
        return `${super.descrever()} | tipo ${this.tipo}`
    }
}
