import Menu, { OpcaoMenu } from './menu'

export default class MenuAuditor extends Menu {
    public override get titulo(): string {
        return 'GREENCODE - AUDITORIA (somente leitura)'
    }

    public override opcoes(): OpcaoMenu[] {
        return [
            {
                comando: 'rastrear <codigo-de-barras>',
                descricao: 'Trajetoria completa de um equipamento',
                campos: [{ rotulo: 'Codigo de barras', obrigatorio: true }]
            },
            {
                comando: 'relatorio organizacao <id>',
                descricao: 'Resumo dos lotes recebidos da organizacao',
                campos: [{ rotulo: 'ID da organizacao (ex.: BR001)', obrigatorio: true }]
            },
            {
                comando: 'journal listar --filtro <texto>',
                descricao: 'Consulta o log de auditoria',
                campos: [
                    { opcao: 'filtro', rotulo: 'Filtro de texto (em branco mostra tudo)', obrigatorio: false },
                    { opcao: 'limite', rotulo: 'Quantidade de linhas (padrao 30)', obrigatorio: false }
                ]
            },
            { comando: 'org listar', descricao: 'Lista as organizacoes cadastradas' },
            { comando: 'lote listar', descricao: 'Lista os lotes recebidos' },
            { comando: 'equip listar', descricao: 'Lista os equipamentos' }
        ]
    }
}
