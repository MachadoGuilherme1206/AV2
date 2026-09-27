import Menu, { OpcaoMenu } from './menu'

export default class MenuAdministrador extends Menu {
    public override get titulo(): string {
        return 'GREENCODE - ADMINISTRACAO DO SISTEMA'
    }

    public override opcoes(): OpcaoMenu[] {
        return [
            {
                comando: 'usuario criar --papel <papel> --login <login>',
                descricao: 'Cria uma conta de acesso',
                campos: [
                    { opcao: 'papel', rotulo: 'Papel (ADMINISTRADOR, OPERADOR_CADASTRO, GESTOR_ALMOXARIFADO, AUDITOR)', obrigatorio: true },
                    { opcao: 'login', rotulo: 'Login', obrigatorio: true },
                    { opcao: 'senha', rotulo: 'Senha inicial (min. 6 caracteres)', obrigatorio: true }
                ]
            },
            { comando: 'usuario listar', descricao: 'Lista as contas cadastradas' },
            {
                comando: 'usuario desativar --login <login>',
                descricao: 'Desativa uma conta',
                campos: [{ opcao: 'login', rotulo: 'Login da conta', obrigatorio: true }]
            },
            { comando: 'config ver', descricao: 'Mostra os parametros globais' },
            {
                comando: 'config definir --chave <k> --valor <v>',
                descricao: 'Altera um parametro global',
                campos: [
                    { opcao: 'chave', rotulo: 'Chave do parametro', obrigatorio: true },
                    { opcao: 'valor', rotulo: 'Novo valor', obrigatorio: true }
                ]
            },
            { comando: 'org listar', descricao: 'Lista as organizacoes cadastradas' },
            { comando: 'lote listar', descricao: 'Lista os lotes recebidos' },
            { comando: 'equip listar', descricao: 'Lista os equipamentos' },
            {
                comando: 'rastrear <codigo-de-barras>',
                descricao: 'Rastreia um equipamento',
                campos: [{ rotulo: 'Codigo de barras', obrigatorio: true }]
            },
            {
                comando: 'journal listar --filtro <texto>',
                descricao: 'Consulta o log de auditoria',
                campos: [
                    { opcao: 'filtro', rotulo: 'Filtro de texto (em branco mostra tudo)', obrigatorio: false },
                    { opcao: 'limite', rotulo: 'Quantidade de linhas (padrao 30)', obrigatorio: false }
                ]
            }
        ]
    }
}
