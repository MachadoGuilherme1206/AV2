import Usuario from '../classes/usuario'
import Administrador from '../classes/administrador'
import OperadorCadastro from '../classes/operador-cadastro'
import GestorAlmoxarifado from '../classes/gestor-almoxarifado'
import Auditor from '../classes/auditor'
import { gerarId } from '../util/identificador'

export default class FabricaUsuario {
    public static criar(papel: string, login: string, senhaHash: string, id?: string): Usuario {
        const papelNormalizado = papel.trim().toUpperCase()
        const identificador = id ?? gerarId('US')

        switch (papelNormalizado) {
            case 'ADMINISTRADOR':
                return new Administrador(identificador, login, senhaHash)

            case 'OPERADOR_CADASTRO':
            case 'OPERADOR':
                return new OperadorCadastro(identificador, login, senhaHash)

            case 'GESTOR_ALMOXARIFADO':
            case 'GESTOR':
                return new GestorAlmoxarifado(identificador, login, senhaHash)

            case 'AUDITOR':
                return new Auditor(identificador, login, senhaHash)

            default:
                throw new Error(
                    `Papel desconhecido: ${papel}. ` +
                    `Papeis aceitos: ${FabricaUsuario.papeisDisponiveis().join(', ')}.`
                )
        }
    }

    public static papeisDisponiveis(): string[] {
        return ['ADMINISTRADOR', 'OPERADOR_CADASTRO', 'GESTOR_ALMOXARIFADO', 'AUDITOR']
    }
}
