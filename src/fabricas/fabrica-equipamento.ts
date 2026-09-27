import Equipamento from '../classes/equipamento'
import Computador from '../classes/computador'
import Monitor from '../classes/monitor'
import Periferico from '../classes/periferico'

export type DadosEquipamento = {
    loteId: string
    marca: string
    modelo: string
    processador?: string
    memoriaGb?: number
    temHd?: boolean
    polegadas?: number
    tecnologia?: string
    tipo?: string
}

export default class FabricaEquipamento {
    private static readonly SIGLAS: Record<string, string> = {
        COMPUTADOR: 'COM',
        MONITOR: 'MON',
        PERIFERICO: 'PER'
    }

    public static siglaDe(tipo: string): string {
        return FabricaEquipamento.SIGLAS[tipo.trim().toUpperCase()] ?? 'GEN'
    }

    public static criar(
        tipo: string,
        dados: DadosEquipamento,
        identidade: { id: string; codigoBarras: string }
    ): Equipamento {
        const tipoNormalizado = tipo.trim().toUpperCase()
        const id = identidade.id
        const codigo = identidade.codigoBarras

        switch (tipoNormalizado) {
            case 'COMPUTADOR':
                return new Computador(
                    id,
                    codigo,
                    dados.loteId,
                    dados.marca,
                    dados.modelo,
                    dados.processador ?? 'nao informado',
                    dados.memoriaGb ?? 0,
                    dados.temHd ?? false
                )

            case 'MONITOR':
                return new Monitor(
                    id,
                    codigo,
                    dados.loteId,
                    dados.marca,
                    dados.modelo,
                    dados.polegadas ?? 0,
                    dados.tecnologia ?? 'LCD'
                )

            case 'PERIFERICO':
                return new Periferico(
                    id,
                    codigo,
                    dados.loteId,
                    dados.marca,
                    dados.modelo,
                    dados.tipo ?? 'OUTRO'
                )

            default:
                throw new Error(
                    `Tipo de equipamento desconhecido: ${tipo}. ` +
                    `Tipos aceitos: ${FabricaEquipamento.tiposDisponiveis().join(', ')}.`
                )
        }
    }

    public static tiposDisponiveis(): string[] {
        return Object.keys(FabricaEquipamento.SIGLAS)
    }
}
