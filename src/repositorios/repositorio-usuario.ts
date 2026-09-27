import RepositorioArquivo, { RegistroBruto } from './repositorio-arquivo'
import Usuario from '../classes/usuario'
import FabricaUsuario from '../fabricas/fabrica-usuario'

export default class RepositorioUsuario extends RepositorioArquivo {
    public override get nomeArquivo(): string {
        return 'usuarios.enc'
    }

    public salvar(usuario: Usuario): void {
        const registros = this.lerRegistros()
        const posicao = registros.findIndex((registro) => registro.login === usuario.login)
        const novo = RepositorioUsuario.paraRegistro(usuario)

        if (posicao >= 0) {
            registros[posicao] = novo
        } else {
            registros.push(novo)
        }

        this.salvarRegistros(registros)
    }

    public buscarPorLogin(login: string): Usuario | undefined {
        const registro = this.lerRegistros()
            .find((item) => item.login === login.trim().toLowerCase())

        return registro === undefined ? undefined : RepositorioUsuario.deRegistro(registro)
    }

    public listar(): Usuario[] {
        return this.lerRegistros().map((registro) => RepositorioUsuario.deRegistro(registro))
    }

    public loginJaExiste(login: string): boolean {
        return this.buscarPorLogin(login) !== undefined
    }

    public vazio(): boolean {
        return this.quantidade() === 0
    }

    private static paraRegistro(usuario: Usuario): RegistroBruto {
        return {
            id: usuario.id,
            login: usuario.login,
            papel: usuario.papel,
            senhaHash: usuario.hashArmazenado,
            ativo: usuario.estaAtivo,
            ultimoAcesso: usuario.acessoAnterior === null ? null : usuario.acessoAnterior.toISOString()
        }
    }

    private static deRegistro(registro: RegistroBruto): Usuario {
        const usuario = FabricaUsuario.criar(
            registro.papel,
            registro.login,
            registro.senhaHash,
            registro.id
        )

        if (registro.ativo === false) {
            usuario.desativar()
        }

        return usuario
    }
}
