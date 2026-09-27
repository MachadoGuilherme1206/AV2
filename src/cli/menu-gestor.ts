import Menu, { OpcaoMenu } from './menu'

const COMPUTADOR = { opcao: 'tipo', valor: 'COMPUTADOR' }
const MONITOR = { opcao: 'tipo', valor: 'MONITOR' }
const PERIFERICO = { opcao: 'tipo', valor: 'PERIFERICO' }

export default class MenuGestor extends Menu {
    private static readonly ESTADOS = 'NOVO, BOM, REGULAR, RUIM, SUCATA'

    public override get titulo(): string {
        return 'GREENCODE - ALMOXARIFADO'
    }

    public override opcoes(): OpcaoMenu[] {
        return [
            {
                comando: 'lote criar --org <id> --nf <n> --transp <nome>',
                descricao: 'Registra a chegada de um lote',
                campos: [
                    { opcao: 'org', rotulo: 'ID da organizacao (ex.: BR001)', obrigatorio: true },
                    { opcao: 'nf', rotulo: 'Numero da nota fiscal', obrigatorio: true },
                    { opcao: 'transp', rotulo: 'Transportadora', obrigatorio: true },
                    { opcao: 'data', rotulo: 'Data de entrada AAAA-MM-DD (em branco usa hoje)', obrigatorio: false }
                ]
            },
            { comando: 'lote listar', descricao: 'Lista os lotes recebidos' },
            {
                comando: 'lote ver <id>',
                descricao: 'Mostra o lote e seus equipamentos',
                campos: [{ rotulo: 'ID do lote (ex.: LT001)', obrigatorio: true }]
            },
            {
                comando: 'equip criar --lote <id> --tipo <tipo>',
                descricao: 'Cadastra um equipamento no lote',
                campos: [
                    { opcao: 'lote', rotulo: 'ID do lote (ex.: LT001)', obrigatorio: true },
                    { opcao: 'tipo', rotulo: 'Tipo (COMPUTADOR, MONITOR, PERIFERICO)', obrigatorio: true },
                    { opcao: 'marca', rotulo: 'Marca', obrigatorio: false },
                    { opcao: 'modelo', rotulo: 'Modelo', obrigatorio: false },
                    { opcao: 'proc', rotulo: 'Processador', obrigatorio: false, quando: COMPUTADOR },
                    { opcao: 'memoria', rotulo: 'Memoria em GB', obrigatorio: false, quando: COMPUTADOR },
                    { opcao: 'hd', rotulo: 'Possui HD? (sim/nao)', obrigatorio: false, quando: COMPUTADOR },
                    { opcao: 'polegadas', rotulo: 'Tamanho da tela em polegadas', obrigatorio: false, quando: MONITOR },
                    { opcao: 'tec', rotulo: 'Tecnologia da tela (LCD, LED, CRT)', obrigatorio: false, quando: MONITOR },
                    { opcao: 'subtipo', rotulo: 'Subtipo (TECLADO, MOUSE, CABO, FONTE, IMPRESSORA)', obrigatorio: false, quando: PERIFERICO },
                    { opcao: 'codigo', rotulo: 'Codigo de barras (em branco o sistema gera)', obrigatorio: false }
                ]
            },
            {
                comando: 'equip listar --lote <id>',
                descricao: 'Lista os equipamentos de um lote',
                campos: [{ opcao: 'lote', rotulo: 'ID do lote (em branco lista todos)', obrigatorio: false }]
            },
            {
                comando: 'triagem <codigo> --estado <estado>',
                descricao: 'Conclui a triagem do equipamento',
                campos: [
                    { rotulo: 'Codigo de barras', obrigatorio: true },
                    { opcao: 'estado', rotulo: `Estado fisico (${MenuGestor.ESTADOS})`, obrigatorio: true }
                ]
            },
            {
                comando: 'equip estado <codigo> --para <estado>',
                descricao: 'Altera o estado fisico',
                campos: [
                    { rotulo: 'Codigo de barras', obrigatorio: true },
                    { opcao: 'para', rotulo: `Novo estado fisico (${MenuGestor.ESTADOS})`, obrigatorio: true },
                    { opcao: 'motivo', rotulo: 'Justificativa (obrigatoria na queda de dois niveis)', obrigatorio: false }
                ]
            },
            {
                comando: 'mover <codigo> --para <status>',
                descricao: 'Movimenta o equipamento no fluxo',
                campos: [
                    { rotulo: 'Codigo de barras', obrigatorio: true },
                    { opcao: 'para', rotulo: 'Novo status (TRIADO, DESMONTE, RECICLADO, DESCARTADO)', obrigatorio: true },
                    { opcao: 'motivo', rotulo: 'Motivo da movimentacao', obrigatorio: false }
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
