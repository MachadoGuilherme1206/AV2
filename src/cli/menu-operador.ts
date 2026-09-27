import Menu, { OpcaoMenu } from './menu'

export default class MenuOperador extends Menu {
    public override get titulo(): string {
        return 'GREENCODE - CADASTRO DE ORGANIZACOES'
    }

    public override opcoes(): OpcaoMenu[] {
        return [
            {
                comando: 'org criar --razao <nome> --cnpj <cnpj>',
                descricao: 'Cadastra uma organizacao geradora',
                campos: [
                    { opcao: 'razao', rotulo: 'Razao social', obrigatorio: true },
                    { opcao: 'cnpj', rotulo: 'CNPJ (com ou sem pontuacao)', obrigatorio: true },
                    { opcao: 'fantasia', rotulo: 'Nome fantasia (em branco repete a razao social)', obrigatorio: false },
                    { opcao: 'log', rotulo: 'Logradouro', obrigatorio: false },
                    { opcao: 'num', rotulo: 'Numero', obrigatorio: false },
                    { opcao: 'bairro', rotulo: 'Bairro', obrigatorio: false },
                    { opcao: 'cidade', rotulo: 'Cidade', obrigatorio: false },
                    { opcao: 'uf', rotulo: 'UF (padrao SP)', obrigatorio: false },
                    { opcao: 'cep', rotulo: 'CEP', obrigatorio: false }
                ]
            },
            { comando: 'org listar', descricao: 'Lista as organizacoes cadastradas' },
            {
                comando: 'org ver <id>',
                descricao: 'Mostra os dados de uma organizacao',
                campos: [{ rotulo: 'ID da organizacao (ex.: BR001)', obrigatorio: true }]
            },
            {
                comando: 'contrato criar --org <id> --numero <n>',
                descricao: 'Registra um contrato de coleta',
                campos: [
                    { opcao: 'org', rotulo: 'ID da organizacao (ex.: BR001)', obrigatorio: true },
                    { opcao: 'numero', rotulo: 'Numero do contrato', obrigatorio: true },
                    { opcao: 'inicio', rotulo: 'Inicio AAAA-MM-DD (em branco usa hoje)', obrigatorio: false },
                    { opcao: 'fim', rotulo: 'Fim AAAA-MM-DD (em branco usa um ano)', obrigatorio: false },
                    { opcao: 'dias', rotulo: 'Periodicidade em dias (padrao 30)', obrigatorio: false }
                ]
            },
            {
                comando: 'relatorio organizacao <id>',
                descricao: 'Resumo dos lotes recebidos da organizacao',
                campos: [{ rotulo: 'ID da organizacao (ex.: BR001)', obrigatorio: true }]
            },
            {
                comando: 'rastrear <codigo-de-barras>',
                descricao: 'Rastreia um equipamento',
                campos: [{ rotulo: 'Codigo de barras', obrigatorio: true }]
            }
        ]
    }
}
