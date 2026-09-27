import Sessao from '../classes/sessao'

export type CampoMenu = {
    opcao?: string
    rotulo: string
    obrigatorio: boolean
    quando?: { opcao: string; valor: string }
}

export type OpcaoMenu = {
    comando: string
    descricao: string
    campos?: CampoMenu[]
}

export default abstract class Menu {
    private static readonly LARGURA_DESCRICAO = 42

    protected readonly sessao: Sessao

    constructor(sessao: Sessao) {
        this.sessao = sessao
    }

    public abstract get titulo(): string

    public abstract opcoes(): OpcaoMenu[]

    public opcoesPermitidas(): OpcaoMenu[] {
        return this.opcoes().filter((opcao) =>
            this.sessao.usuario.podeExecutar(Menu.comandoBase(opcao.comando))
        )
    }

    public renderizar(): string {
        const linhas: string[] = []
        const usuario = this.sessao.usuario

        linhas.push('')
        linhas.push('='.repeat(72))
        linhas.push(`  ${this.titulo}`)
        linhas.push(`  ${usuario.login} | ${usuario.papel} | sessao expira em ${this.sessao.minutosRestantes()} min`)
        linhas.push('='.repeat(72))

        this.opcoesPermitidas().forEach((opcao, indice) => {
            linhas.push(Menu.linhaDaOpcao(
                `[${indice + 1}]`,
                opcao.descricao,
                Menu.comandoBase(opcao.comando)
            ))
        })

        linhas.push('-'.repeat(72))
        linhas.push(Menu.linhaDaOpcao('[0]', 'Encerra a sessao', 'sair'))
        linhas.push(Menu.linhaDaOpcao('[?]', 'Mostra este menu novamente', 'ajuda'))
        linhas.push('-'.repeat(72))
        linhas.push('  Digite o numero da opcao: o sistema pergunta os dados um a um.')
        linhas.push('  Quem preferir digita o comando da coluna da direita com os')
        linhas.push('  parametros, por exemplo: lote criar --org BR001 --nf 123456')
        linhas.push('='.repeat(72))

        return linhas.join('\n')
    }

    private static linhaDaOpcao(numero: string, descricao: string, comando: string): string {
        return `  ${numero.padStart(4)} ${descricao.padEnd(Menu.LARGURA_DESCRICAO)} ${comando}`
    }

    public static comandoBase(comando: string): string {
        const partes = comando.split(' ').filter((parte) => !parte.startsWith('--') && !parte.startsWith('<'))
        return partes.slice(0, 2).join(' ').trim()
    }
}
