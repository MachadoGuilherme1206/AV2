export default abstract class Usuario {
    readonly id: string
    readonly login: string
    private senhaHash: string
    private ativo: boolean
    private ultimoAcesso: Date | null

    protected static readonly COMANDOS_COMUNS = ['ajuda', 'menu', 'sair', 'wall-e']

    constructor(id: string, login: string, senhaHash: string) {
        this.id = id
        this.login = login
        this.senhaHash = senhaHash
        this.ativo = true
        this.ultimoAcesso = null
    }

    public abstract get papel(): string

    public abstract permissoes(): string[]

    public podeExecutar(comando: string): boolean {
        const procurado = comando.trim().toLowerCase()
        const acao = procurado.split(' ')[0]

        return this.permissoes().some((permissao) => {
            if (permissao === '*') {
                return true
            }
            if (permissao === acao) {
                return true
            }
            return permissao === procurado
        })
    }

    public verificarHash(hashInformado: string): boolean {
        return this.ativo && this.senhaHash === hashInformado
    }

    public get hashArmazenado(): string {
        return this.senhaHash
    }

    public set alterarSenhaHash(novoHash: string) {
        this.senhaHash = novoHash
    }

    public get estaAtivo(): boolean {
        return this.ativo
    }

    public desativar(): void {
        this.ativo = false
    }

    public reativar(): void {
        this.ativo = true
    }

    public registrarAcesso(): void {
        this.ultimoAcesso = new Date()
    }

    public get acessoAnterior(): Date | null {
        return this.ultimoAcesso
    }

    public descrever(): string {
        const situacao = this.ativo ? 'ativo' : 'inativo'
        return `${this.login} (${this.papel}, ${situacao})`
    }
}
