import { EstadoFisico, nomeDoEstado } from '../tipos/estado-fisico'
import { StatusEquipamento } from '../tipos/status-equipamento'
import ValidadorTransicaoStatus from '../validadores/validador-transicao-status'
import ValidadorQuedaEstado from '../validadores/validador-queda-estado'

export default abstract class Equipamento {
    readonly id: string
    readonly codigoBarras: string
    readonly loteId: string
    readonly marca: string
    readonly modelo: string
    private estado: EstadoFisico | null
    private status: StatusEquipamento

    constructor(id: string, codigoBarras: string, loteId: string, marca: string, modelo: string) {
        this.id = id
        this.codigoBarras = codigoBarras
        this.loteId = loteId
        this.marca = marca
        this.modelo = modelo
        this.estado = null
        this.status = StatusEquipamento.RECEBIDO
    }

    public abstract get categoria(): string

    public get estadoAtual(): EstadoFisico | null {
        return this.estado
    }

    public get statusAtual(): StatusEquipamento {
        return this.status
    }

    public get foiTriado(): boolean {
        return this.status !== StatusEquipamento.RECEBIDO && this.estado !== null
    }

    public concluirTriagem(estado: EstadoFisico): void {
        const validador = new ValidadorTransicaoStatus(this.status)
        validador.validarOuFalhar(StatusEquipamento.TRIADO)

        this.estado = estado
        this.status = StatusEquipamento.TRIADO
    }

    public alterarEstado(novoEstado: EstadoFisico, justificativa: string = ''): void {
        if (this.estado === null) {
            throw new Error(
                `Equipamento ${this.codigoBarras} ainda nao passou por triagem. ` +
                'Informe o estado fisico atraves do comando de triagem.'
            )
        }

        const validador = new ValidadorQuedaEstado(this.estado)
        validador.validarOuFalhar({ novoEstado, justificativa })

        this.estado = novoEstado
    }

    public exigeJustificativaPara(novoEstado: EstadoFisico): boolean {
        if (this.estado === null) {
            return false
        }
        return new ValidadorQuedaEstado(this.estado).exigeJustificativa(novoEstado)
    }

    public moverPara(novoStatus: StatusEquipamento): void {
        const validador = new ValidadorTransicaoStatus(this.status)
        validador.validarOuFalhar(novoStatus)

        this.status = novoStatus
    }

    public restaurar(estado: EstadoFisico | null, status: StatusEquipamento): void {
        this.estado = estado
        this.status = status
    }

    public get estadoLegivel(): string {
        return this.estado === null ? 'NAO TRIADO' : nomeDoEstado(this.estado)
    }

    public descrever(): string {
        return `${this.codigoBarras} | ${this.categoria} ${this.marca} ${this.modelo} | ` +
            `${this.status} | ${this.estadoLegivel}`
    }
}
