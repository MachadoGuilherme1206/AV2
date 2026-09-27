import Validador from './validador'
import ResultadoValidacao from './resultado-validacao'
import { StatusEquipamento, destinosPermitidos, statusFinal } from '../tipos/status-equipamento'

export default class ValidadorTransicaoStatus extends Validador {
    private readonly statusAtual: StatusEquipamento

    constructor(statusAtual: StatusEquipamento) {
        super('Transicao de status')
        this.statusAtual = statusAtual
    }

    public validar(valor: unknown): ResultadoValidacao {
        const destino = valor as StatusEquipamento

        if (statusFinal(this.statusAtual)) {
            return this.falha(
                `${this.statusAtual} e um status final. Nenhuma movimentacao e permitida.`
            )
        }

        const permitidos = destinosPermitidos(this.statusAtual)

        if (!permitidos.includes(destino)) {
            if (destino === StatusEquipamento.DESMONTE && this.statusAtual === StatusEquipamento.RECEBIDO) {
                return this.falha(
                    'Equipamento esta em RECEBIDO. Desmonte exige triagem completa.'
                )
            }

            return this.falha(
                `Transicao de ${this.statusAtual} para ${destino} nao e permitida. ` +
                `Destinos validos: ${permitidos.join(', ')}.`
            )
        }

        return this.sucesso()
    }
}
