import Usuario from '../classes/usuario'
import Sessao from '../classes/sessao'
import RepositorioUsuario from '../repositorios/repositorio-usuario'
import ServicoCriptografia from './servico-criptografia'
import ServicoJournal from './servico-journal'
import FabricaUsuario from '../fabricas/fabrica-usuario'

export default class ServicoAutenticacao {
    private readonly repositorio: RepositorioUsuario
    private readonly journal: ServicoJournal

    constructor(repositorio: RepositorioUsuario, journal: ServicoJournal) {
        this.repositorio = repositorio
        this.journal = journal
    }

    public autenticar(login: string, senha: string): Sessao | null {
        const usuario = this.repositorio.buscarPorLogin(login)

        if (usuario === undefined) {
            this.journal.registrar('LOGIN_FALHA', login.trim().toLowerCase(), 'usuario inexistente')
            return null
        }

        const hash = ServicoCriptografia.gerarHash(senha)

        if (!usuario.verificarHash(hash)) {
            this.journal.registrar('LOGIN_FALHA', usuario.login, 'credenciais invalidas ou conta inativa')
            return null
        }

        usuario.registrarAcesso()
        this.repositorio.salvar(usuario)
        this.journal.registrar('LOGIN_SUCESSO', usuario.login, `papel=${usuario.papel}`)

        return new Sessao(usuario)
    }

    public criarUsuario(papel: string, login: string, senha: string, criadoPor: string): Usuario {
        const loginNormalizado = login.trim().toLowerCase()

        if (loginNormalizado.length < 3) {
            throw new Error('Login deve ter no minimo 3 caracteres.')
        }

        if (senha.length < 6) {
            throw new Error('Senha deve ter no minimo 6 caracteres.')
        }

        if (this.repositorio.loginJaExiste(loginNormalizado)) {
            throw new Error(`Login '${loginNormalizado}' ja esta em uso.`)
        }

        const usuario = FabricaUsuario.criar(
            papel,
            loginNormalizado,
            ServicoCriptografia.gerarHash(senha)
        )

        this.journal.registrar('USUARIO_CRIAR', criadoPor, `login=${loginNormalizado} papel=${usuario.papel}`)
        this.repositorio.salvar(usuario)

        return usuario
    }

    public encerrar(sessao: Sessao, motivo: string): void {
        this.journal.registrar('LOGOUT', sessao.usuario.login, motivo)
    }
}
