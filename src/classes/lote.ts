import Equipamento from './equipamento'
import ValidadorDataLote from '../validadores/validador-data-lote'

export default class Lote {
    readonly id: string
    readonly organizacaoId: string
    readonly notaFiscal: string
    readonly transportadora: string
    readonly dataEntrada: Date
    private equipamentos: Equipamento[]

    constructor(
        id: string,
        organizacaoId: string,
        notaFiscal: string,
        transportadora: string,
        dataEntrada: Date
    ) {
        this.id = id
        this.organizacaoId = organizacaoId
        this.notaFiscal = notaFiscal
        this.transportadora = transportadora
        this.dataEntrada = dataEntrada
        this.equipamentos = []
    }

    public adicionar(equipamento: Equipamento): void {
        if (equipamento.loteId !== this.id) {
            throw new Error(
                `Equipamento ${equipamento.codigoBarras} pertence ao lote ${equipamento.loteId}, nao ao ${this.id}.`
            )
        }
        this.equipamentos.push(equipamento)
    }

    public totalEquipamentos(): number {
        return this.equipamentos.length
    }

    public listarEquipamentos(): Equipamento[] {
        return [...this.equipamentos]
    }

    public descrever(): string {
        const data = ValidadorDataLote.texto(this.dataEntrada)
        return `${this.id} | org ${this.organizacaoId} | NF ${this.notaFiscal} | ` +
            `${this.transportadora} | ${data} | ${this.totalEquipamentos()} itens`
    }
}
