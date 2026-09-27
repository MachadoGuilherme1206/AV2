import RepositorioArquivo, { RegistroBruto } from './repositorio-arquivo'
import Equipamento from '../classes/equipamento'
import Computador from '../classes/computador'
import Monitor from '../classes/monitor'
import Periferico from '../classes/periferico'
import FabricaEquipamento from '../fabricas/fabrica-equipamento'
import { EstadoFisico } from '../tipos/estado-fisico'
import { StatusEquipamento } from '../tipos/status-equipamento'

export default class RepositorioEquipamento extends RepositorioArquivo {
    public override get nomeArquivo(): string {
        return 'equipamentos.enc'
    }

    public salvar(equipamento: Equipamento): void {
        const registros = this.lerRegistros()
        const posicao = registros.findIndex((registro) => registro.id === equipamento.id)
        const novo = RepositorioEquipamento.paraRegistro(equipamento)

        if (posicao >= 0) {
            registros[posicao] = novo
        } else {
            registros.push(novo)
        }

        this.salvarRegistros(registros)
    }

    public buscarPorCodigoBarras(codigo: string): Equipamento | undefined {
        const registro = this.lerRegistros()
            .find((item) => item.codigoBarras === codigo.trim().toUpperCase())

        return registro === undefined ? undefined : RepositorioEquipamento.deRegistro(registro)
    }

    public listar(): Equipamento[] {
        return this.lerRegistros().map((registro) => RepositorioEquipamento.deRegistro(registro))
    }

    public proximoCodigoBarras(sigla: string): string {
        const prefixo = `GC-${sigla}-`
        const maior = this.lerRegistros()
            .filter((registro) => String(registro.codigoBarras ?? '').startsWith(prefixo))
            .reduce((maximo, registro) => {
                const numero = Number(String(registro.codigoBarras).slice(prefixo.length))
                return Number.isFinite(numero) && numero > maximo ? numero : maximo
            }, 0)

        return `${prefixo}${String(maior + 1).padStart(4, '0')}`
    }

    public listarPorLote(loteId: string): Equipamento[] {
        return this.lerRegistros()
            .filter((registro) => registro.loteId === loteId.trim().toUpperCase())
            .map((registro) => RepositorioEquipamento.deRegistro(registro))
    }

    private static paraRegistro(equipamento: Equipamento): RegistroBruto {
        const registro: RegistroBruto = {
            id: equipamento.id,
            tipo: equipamento.categoria,
            codigoBarras: equipamento.codigoBarras,
            loteId: equipamento.loteId,
            marca: equipamento.marca,
            modelo: equipamento.modelo,
            estado: equipamento.estadoAtual,
            status: equipamento.statusAtual
        }

        if (equipamento instanceof Computador) {
            registro.processador = equipamento.processador
            registro.memoriaGb = equipamento.memoriaGb
            registro.temHd = equipamento.temHd
        } else if (equipamento instanceof Monitor) {
            registro.polegadas = equipamento.polegadas
            registro.tecnologia = equipamento.tecnologia
        } else if (equipamento instanceof Periferico) {
            registro.tipoPeriferico = equipamento.tipo
        }

        return registro
    }

    private static deRegistro(registro: RegistroBruto): Equipamento {
        const equipamento = FabricaEquipamento.criar(
            registro.tipo,
            {
                loteId: registro.loteId,
                marca: registro.marca,
                modelo: registro.modelo,
                processador: registro.processador,
                memoriaGb: registro.memoriaGb,
                temHd: registro.temHd,
                polegadas: registro.polegadas,
                tecnologia: registro.tecnologia,
                tipo: registro.tipoPeriferico
            },
            { id: registro.id, codigoBarras: registro.codigoBarras }
        )

        equipamento.restaurar(
            registro.estado === null ? null : (registro.estado as EstadoFisico),
            registro.status as StatusEquipamento
        )

        return equipamento
    }
}
