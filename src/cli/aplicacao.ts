import * as fs from 'node:fs'
import * as readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

import Sessao from '../classes/sessao'
import Usuario from '../classes/usuario'
import Organizacao from '../classes/organizacao'
import Endereco from '../classes/endereco'
import ContratoColeta from '../classes/contrato-coleta'
import Lote from '../classes/lote'
import Movimentacao from '../classes/movimentacao'

import Menu, { OpcaoMenu } from './menu'
import MenuAdministrador from './menu-administrador'
import MenuOperador from './menu-operador'
import MenuGestor from './menu-gestor'
import MenuAuditor from './menu-auditor'
import Mensagem from './mensagem'
import InterpretadorComandos from './interpretador-comandos'
import ComandoAnalisado from './comando-analisado'

import ServicoCriptografia from '../servicos/servico-criptografia'
import ServicoJournal from '../servicos/servico-journal'
import ServicoAutenticacao from '../servicos/servico-autenticacao'
import ServicoRastreabilidade from '../servicos/servico-rastreabilidade'

import RepositorioUsuario from '../repositorios/repositorio-usuario'
import RepositorioOrganizacao from '../repositorios/repositorio-organizacao'
import RepositorioLote from '../repositorios/repositorio-lote'
import RepositorioEquipamento from '../repositorios/repositorio-equipamento'
import RepositorioMovimentacao from '../repositorios/repositorio-movimentacao'
import RepositorioConfiguracao from '../repositorios/repositorio-configuracao'

import FabricaEquipamento from '../fabricas/fabrica-equipamento'
import ValidadorCNPJ from '../validadores/validador-cnpj'
import ValidadorDataLote from '../validadores/validador-data-lote'

import { estadoPorNome, estadosDisponiveis } from '../tipos/estado-fisico'
import { StatusEquipamento, statusPorNome, destinosPermitidos } from '../tipos/status-equipamento'
import { gerarId, gerarIdSequencial } from '../util/identificador'
import { ARQUIVO_HISTORICO_CLI, prepararPastas } from '../util/caminhos'

export default class Aplicacao {
    private readonly interpretador = new InterpretadorComandos()
    private readonly journal = new ServicoJournal()

    private cripto!: ServicoCriptografia
    private usuarios!: RepositorioUsuario
    private organizacoes!: RepositorioOrganizacao
    private lotes!: RepositorioLote
    private equipamentos!: RepositorioEquipamento
    private movimentacoes!: RepositorioMovimentacao
    private configuracao!: RepositorioConfiguracao
    private autenticacao!: ServicoAutenticacao
    private rastreabilidade!: ServicoRastreabilidade

    private sessao: Sessao | null = null
    private leitor!: readline.Interface
    private linhas!: AsyncIterableIterator<string>

    public async iniciar(): Promise<void> {
        prepararPastas()
        this.abrirLeitor()

        try {
            this.imprimirCabecalho()

            if (!ServicoCriptografia.chaveExiste()) {
                await this.provisionar()
            } else {
                this.montarServicos(ServicoCriptografia.carregarChave())
            }

            const autenticado = await this.autenticar()

            if (autenticado) {
                await this.lacoPrincipal()
            }
        } catch (erro) {
            Mensagem.critico(Aplicacao.textoDoErro(erro)).imprimir()
        } finally {
            this.salvarHistorico()
            this.leitor.close()
        }
    }

    private async provisionar(): Promise<void> {
        console.log('')
        console.log('-'.repeat(72))
        console.log('  PROVISIONAMENTO INICIAL')
        console.log('-'.repeat(72))
        Mensagem.aviso('Chave mestra nao encontrada. O sistema sera configurado agora.').imprimir()
        console.log('')

        const chave = ServicoCriptografia.gerarChave()
        ServicoCriptografia.salvarChave(chave)
        this.montarServicos(chave)

        Mensagem.sucesso('Chave de criptografia AES-256 gerada e gravada em config/master.key').imprimir()
        Mensagem.aviso('Sem esse arquivo os dados nao podem ser lidos. Guarde uma copia segura.').imprimir()
        console.log('')

        const login = (await this.perguntarObrigatorio('Login do administrador: ')).trim().toLowerCase()
        const senha = await this.perguntarObrigatorio('Senha do administrador (min. 6 caracteres): ')
        const confirmacao = await this.perguntarObrigatorio('Confirme a senha: ')

        if (senha !== confirmacao) {
            throw new Error('As senhas informadas nao conferem. Provisionamento cancelado.')
        }

        this.journal.registrar('PROVISIONAMENTO', login, 'chave mestra gerada')
        this.autenticacao.criarUsuario('ADMINISTRADOR', login, senha, login)

        console.log('')
        Mensagem.sucesso(`Administrador '${login}' cadastrado. Faca login para continuar.`).imprimir()
    }

    private montarServicos(chaveHex: string): void {
        this.cripto = new ServicoCriptografia(chaveHex)

        this.usuarios = new RepositorioUsuario(this.cripto)
        this.organizacoes = new RepositorioOrganizacao(this.cripto)
        this.lotes = new RepositorioLote(this.cripto)
        this.equipamentos = new RepositorioEquipamento(this.cripto)
        this.movimentacoes = new RepositorioMovimentacao(this.cripto)
        this.configuracao = new RepositorioConfiguracao(this.cripto)

        this.autenticacao = new ServicoAutenticacao(this.usuarios, this.journal)
        this.rastreabilidade = new ServicoRastreabilidade(
            this.equipamentos,
            this.movimentacoes,
            this.lotes,
            this.organizacoes
        )

        this.journal.limparAntigos()
    }

    private async autenticar(): Promise<boolean> {
        const MAXIMO_TENTATIVAS = 3

        for (let tentativa = 1; tentativa <= MAXIMO_TENTATIVAS; tentativa++) {
            console.log('')
            const login = (await this.perguntarObrigatorio('Login: ')).trim().toLowerCase()
            const senha = await this.perguntarObrigatorio('Senha: ')

            const sessao = this.autenticacao.autenticar(login, senha)

            if (sessao !== null) {
                this.sessao = sessao
                Mensagem.sucesso(`Bem-vindo, ${sessao.usuario.login} (${sessao.usuario.papel}).`).imprimir()
                return true
            }

            Mensagem.erro(
                `Credenciais invalidas. Tentativa ${tentativa} de ${MAXIMO_TENTATIVAS}.`
            ).imprimir()
        }

        Mensagem.critico('Numero maximo de tentativas excedido. Encerrando.').imprimir()
        return false
    }

    private async lacoPrincipal(): Promise<void> {
        console.log(this.montarMenu().renderizar())

        while (this.sessao !== null) {
            const linha = await this.perguntar('\ngreencode> ')

            if (linha === null) {
                this.autenticacao.encerrar(this.sessao, 'entrada encerrada')
                Mensagem.info('Entrada encerrada. Sessao finalizada.').imprimir()
                this.sessao = null
                return
            }

            if (this.sessaoExpirou()) {
                return
            }

            const entrada = await this.resolverEntrada(linha)

            if (entrada === null) {
                continue
            }

            const comando = this.interpretador.analisar(entrada)

            if (comando.vazio) {
                continue
            }

            if (comando.acao === 'sair') {
                this.autenticacao.encerrar(this.sessao, 'encerrado pelo usuario')
                Mensagem.info('Sessao encerrada. Ate logo.').imprimir()
                this.sessao = null
                return
            }

            this.despachar(comando)
        }
    }

    private async resolverEntrada(linha: string): Promise<string | null> {
        const digitado = linha.trim()

        if (digitado === '?') {
            return 'ajuda'
        }

        if (!/^[0-9]+$/.test(digitado)) {
            return linha
        }

        const numero = Number(digitado)

        if (numero === 0) {
            return 'sair'
        }

        const opcoes = this.montarMenu().opcoesPermitidas()

        if (numero > opcoes.length) {
            Mensagem.erro(
                `Opcao ${numero} nao existe. Escolha de 1 a ${opcoes.length}, ou 0 para sair.`
            ).imprimir()
            return null
        }

        return await this.montarPelaOpcao(opcoes[numero - 1])
    }

    private async montarPelaOpcao(opcao: OpcaoMenu): Promise<string | null> {
        const base = Menu.comandoBase(opcao.comando)
        const campos = opcao.campos ?? []

        if (campos.length === 0) {
            return base
        }

        const partes = [base]
        const respondido = new Map<string, string>()

        console.log('')
        Mensagem.info(`${opcao.descricao}:`).imprimir()

        for (const campo of campos) {
            if (campo.quando !== undefined) {
                const anterior = respondido.get(campo.quando.opcao) ?? ''

                if (anterior.toUpperCase() !== campo.quando.valor.toUpperCase()) {
                    continue
                }
            }

            const resposta = await this.perguntar(`  ${campo.rotulo}: `)

            if (resposta === null) {
                return null
            }

            const valor = resposta.trim()

            if (valor === '') {
                if (campo.obrigatorio) {
                    Mensagem.aviso('Campo obrigatorio em branco. Operacao cancelada.').imprimir()
                    return null
                }
                continue
            }

            if (campo.opcao !== undefined) {
                respondido.set(campo.opcao, valor)
            }

            const texto = valor.includes(' ') ? `"${valor}"` : valor
            partes.push(campo.opcao === undefined ? texto : `--${campo.opcao} ${texto}`)
        }

        const montado = partes.join(' ')

        Mensagem.info(`Comando equivalente: ${montado}`).imprimir()

        return montado
    }

    private sessaoExpirou(): boolean {
        if (this.sessao === null) {
            return true
        }

        if (this.sessao.expirada()) {
            this.journal.registrar('SESSAO_EXPIRADA', this.sessao.usuario.login, 'inatividade')
            Mensagem.aviso('Sessao expirada por inatividade. Faca login novamente.').imprimir()
            this.sessao = null
            return true
        }

        if (this.sessao.pertoDeExpirar()) {
            Mensagem.aviso(`Sessao expira em ${this.sessao.minutosRestantes()} minutos.`).imprimir()
        }

        return false
    }

    private despachar(comando: ComandoAnalisado): void {
        const sessao = this.sessao

        if (sessao === null) {
            return
        }

        if (!sessao.usuario.podeExecutar(comando.comandoCompleto)) {
            Mensagem.erro(
                `Papel ${sessao.usuario.papel} nao tem permissao para '${comando.comandoCompleto}'.`
            ).imprimir()
            this.journal.registrar('PERMISSAO_NEGADA', sessao.usuario.login, comando.comandoCompleto)
            return
        }

        try {
            this.executar(comando, sessao)
            sessao.renovar()
        } catch (erro) {
            Mensagem.erro(Aplicacao.textoDoErro(erro)).imprimir()
        }
    }

    private executar(comando: ComandoAnalisado, sessao: Sessao): void {
        switch (comando.acao) {
            case 'wall-e':
                this.comandoWallE()
                return
            case 'ajuda':
            case 'menu':
                console.log(this.montarMenu().renderizar())
                return

            case 'usuario':
                this.comandoUsuario(comando, sessao)
                return

            case 'config':
                this.comandoConfiguracao(comando, sessao)
                return

            case 'org':
                this.comandoOrganizacao(comando, sessao)
                return

            case 'contrato':
                this.comandoContrato(comando, sessao)
                return

            case 'lote':
                this.comandoLote(comando, sessao)
                return

            case 'equip':
                this.comandoEquipamento(comando, sessao)
                return

            case 'triagem':
                this.comandoTriagem(comando, sessao)
                return

            case 'mover':
                this.comandoMover(comando, sessao)
                return

            case 'rastrear':
                this.comandoRastrear(comando)
                return

            case 'relatorio':
                this.comandoRelatorio(comando)
                return

            case 'journal':
                this.comandoJournal(comando)
                return

            default:
                Mensagem.erro(
                    `Comando desconhecido: '${comando.acao}'. Digite 'ajuda' para ver as opcoes.`
                ).imprimir()
        }
    }

    private comandoUsuario(comando: ComandoAnalisado, sessao: Sessao): void {
        if (comando.subacao === 'criar') {
            const papel = comando.opcaoObrigatoria('papel')
            const login = comando.opcaoObrigatoria('login')
            const senha = comando.opcaoObrigatoria('senha')

            const usuario = this.autenticacao.criarUsuario(papel, login, senha, sessao.usuario.login)

            Mensagem.sucesso(`Usuario criado: ${usuario.descrever()}`).imprimir()

            if (!comando.temOpcao('senha')) {
                Mensagem.aviso("Senha provisoria definida como 'trocar123'.").imprimir()
            }
            return
        }

        if (comando.subacao === 'listar') {
            const lista = this.usuarios.listar()
            Mensagem.info(`${lista.length} usuario(s) cadastrado(s):`).imprimir()
            lista.forEach((usuario: Usuario) => console.log(`  ${usuario.descrever()}`))
            return
        }

        if (comando.subacao === 'desativar') {
            const login = comando.opcaoObrigatoria('login')
            const usuario = this.usuarios.buscarPorLogin(login)

            if (usuario === undefined) {
                throw new Error(`Usuario '${login}' nao encontrado.`)
            }

            if (usuario.login === sessao.usuario.login) {
                throw new Error('Um administrador nao pode desativar a propria conta.')
            }

            this.journal.registrar('USUARIO_DESATIVAR', sessao.usuario.login, `login=${usuario.login}`)
            usuario.desativar()
            this.usuarios.salvar(usuario)

            Mensagem.sucesso(`Usuario '${usuario.login}' desativado.`).imprimir()
            return
        }

        throw new Error("Subacao invalida. Use: usuario criar | usuario listar | usuario desativar")
    }

    private comandoConfiguracao(comando: ComandoAnalisado, sessao: Sessao): void {
        if (comando.subacao === 'ver') {
            Mensagem.info('Parametros globais:').imprimir()
            this.configuracao.listarTudo().forEach((valor, chave) => {
                console.log(`  ${chave.padEnd(24)} ${valor}`)
            })
            return
        }

        if (comando.subacao === 'definir') {
            const chave = comando.opcaoObrigatoria('chave')
            const valor = comando.opcaoObrigatoria('valor')

            this.journal.registrar('CONFIG_DEFINIR', sessao.usuario.login, `${chave}=${valor}`)
            this.configuracao.definir(chave, valor)

            Mensagem.sucesso(`Parametro '${chave}' definido como '${valor}'.`).imprimir()
            return
        }

        throw new Error('Subacao invalida. Use: config ver | config definir')
    }

    private comandoOrganizacao(comando: ComandoAnalisado, sessao: Sessao): void {
        if (comando.subacao === 'criar') {
            const razao = comando.opcaoObrigatoria('razao')
            const cnpj = comando.opcaoObrigatoria('cnpj')

            new ValidadorCNPJ().validarOuFalhar(cnpj)

            const jaCadastrado = this.organizacoes.cnpjJaCadastrado(cnpj)

            if (jaCadastrado !== undefined) {
                throw new Error(
                    `CNPJ ${ValidadorCNPJ.formatar(cnpj)} ja pertence a organizacao ${jaCadastrado}.`
                )
            }

            const endereco = new Endereco(
                comando.opcao('log', 'nao informado'),
                comando.opcao('num', 's/n'),
                comando.opcao('bairro', 'nao informado'),
                comando.opcao('cidade', 'nao informado'),
                comando.opcao('uf', 'SP'),
                comando.opcao('cep', '00000000')
            )

            const id = gerarIdSequencial('BR', this.organizacoes.quantidade())
            const organizacao = new Organizacao(
                id,
                razao,
                comando.opcao('fantasia', razao),
                cnpj,
                endereco
            )

            this.journal.registrar(
                'ORG_CRIAR',
                sessao.usuario.login,
                `id=${id} cnpj=${ValidadorCNPJ.apenasDigitos(cnpj)}`
            )
            this.organizacoes.salvar(organizacao)

            Mensagem.sucesso(`Organizacao cadastrada: ${organizacao.descrever()}`).imprimir()
            return
        }

        if (comando.subacao === 'listar') {
            const lista = this.organizacoes.listar()
            Mensagem.info(`${lista.length} organizacao(oes) cadastrada(s):`).imprimir()
            lista.forEach((organizacao) => console.log(`  ${organizacao.descrever()}`))
            return
        }

        if (comando.subacao === 'ver') {
            const id = comando.posicionalObrigatorio(0, '<id da organizacao>')
            const organizacao = this.organizacoes.buscarPorId(id)

            if (organizacao === undefined) {
                throw new Error(`Organizacao '${id}' nao encontrada.`)
            }

            Mensagem.info(organizacao.descrever()).imprimir()
            console.log(`  Endereco: ${organizacao.endereco.mostrarEndereco()}`)
            console.log(`  Contratos: ${organizacao.listarContratos().length}`)
            organizacao.listarContratos().forEach((contrato) => console.log(`    ${contrato.descrever()}`))
            return
        }

        throw new Error('Subacao invalida. Use: org criar | org listar | org ver')
    }

    private comandoContrato(comando: ComandoAnalisado, sessao: Sessao): void {
        if (comando.subacao !== 'criar') {
            throw new Error('Subacao invalida. Use: contrato criar')
        }

        const organizacaoId = comando.opcaoObrigatoria('org')
        const numero = comando.opcaoObrigatoria('numero')
        const organizacao = this.organizacoes.buscarPorId(organizacaoId)

        if (organizacao === undefined) {
            throw new Error(`Organizacao '${organizacaoId}' nao encontrada.`)
        }

        const inicio = comando.temOpcao('inicio')
            ? ValidadorDataLote.converter(comando.opcao('inicio'))
            : new Date()

        const fim = comando.temOpcao('fim')
            ? ValidadorDataLote.converter(comando.opcao('fim'))
            : new Date(inicio.getFullYear() + 1, inicio.getMonth(), inicio.getDate())

        const periodicidade = Number(comando.opcao('dias', '30'))

        organizacao.adicionarContrato(new ContratoColeta(numero, inicio, fim, periodicidade))

        this.journal.registrar('CONTRATO_CRIAR', sessao.usuario.login, `org=${organizacao.id} numero=${numero}`)
        this.organizacoes.salvar(organizacao)

        Mensagem.sucesso(`Contrato ${numero} registrado para ${organizacao.id}.`).imprimir()
    }

    private comandoLote(comando: ComandoAnalisado, sessao: Sessao): void {
        if (comando.subacao === 'criar') {
            const organizacaoId = comando.opcaoObrigatoria('org')
            const notaFiscal = comando.opcaoObrigatoria('nf')
            const transportadora = comando.opcaoObrigatoria('transp')

            if (this.organizacoes.buscarPorId(organizacaoId) === undefined) {
                throw new Error(`Organizacao '${organizacaoId}' nao encontrada.`)
            }

            const dataEntrada = comando.temOpcao('data')
                ? ValidadorDataLote.converter(comando.opcao('data'))
                : new Date()

            new ValidadorDataLote().validarOuFalhar(dataEntrada)

            const id = gerarIdSequencial('LT', this.lotes.quantidade())
            const lote = new Lote(
                id,
                organizacaoId.toUpperCase(),
                notaFiscal,
                transportadora,
                dataEntrada
            )

            this.journal.registrar(
                'LOTE_CRIAR',
                sessao.usuario.login,
                `id=${id} org=${organizacaoId} nf=${notaFiscal} transp=${transportadora}`
            )
            this.lotes.salvar(lote)

            Mensagem.sucesso(`Lote criado: ${lote.descrever()}`).imprimir()
            return
        }

        if (comando.subacao === 'listar') {
            const lista = comando.temOpcao('org')
                ? this.lotes.listarPorOrganizacao(comando.opcao('org'))
                : this.lotes.listar()

            Mensagem.info(`${lista.length} lote(s):`).imprimir()

            lista.forEach((lote) => {
                const itens = this.equipamentos.listarPorLote(lote.id)
                itens.forEach((item) => lote.adicionar(item))
                console.log(`  ${lote.descrever()}`)
            })
            return
        }

        if (comando.subacao === 'ver') {
            const id = comando.posicionalObrigatorio(0, '<id do lote>')
            const lote = this.lotes.buscarPorId(id)

            if (lote === undefined) {
                throw new Error(`Lote '${id}' nao encontrado.`)
            }

            this.equipamentos.listarPorLote(lote.id).forEach((item) => lote.adicionar(item))

            Mensagem.info(lote.descrever()).imprimir()
            lote.listarEquipamentos().forEach((item) => console.log(`  ${item.descrever()}`))
            return
        }

        throw new Error('Subacao invalida. Use: lote criar | lote listar | lote ver')
    }

    private comandoEquipamento(comando: ComandoAnalisado, sessao: Sessao): void {
        if (comando.subacao === 'criar') {
            const loteId = comando.opcaoObrigatoria('lote')
            const tipo = comando.opcaoObrigatoria('tipo')

            if (this.lotes.buscarPorId(loteId) === undefined) {
                throw new Error(`Lote '${loteId}' nao encontrado.`)
            }

            const codigoInformado = comando.opcao('codigo').toUpperCase()

            if (codigoInformado !== '' && this.equipamentos.buscarPorCodigoBarras(codigoInformado) !== undefined) {
                throw new Error(`Codigo de barras '${codigoInformado}' ja esta em uso.`)
            }

            const sigla = FabricaEquipamento.siglaDe(tipo)
            const codigoBarras = codigoInformado === ''
                ? this.equipamentos.proximoCodigoBarras(sigla)
                : codigoInformado

            const identidade = { id: gerarId('EQ'), codigoBarras }

            const equipamento = FabricaEquipamento.criar(tipo, {
                loteId: loteId.toUpperCase(),
                marca: comando.opcao('marca', 'nao informada'),
                modelo: comando.opcao('modelo', 'nao informado'),
                processador: comando.opcao('proc', 'nao informado'),
                memoriaGb: Number(comando.opcao('memoria', '0')),
                temHd: comando.opcao('hd', 'nao') === 'sim',
                polegadas: Number(comando.opcao('polegadas', '0')),
                tecnologia: comando.opcao('tec', 'LCD'),
                tipo: comando.opcao('subtipo', 'OUTRO')
            }, identidade)

            this.journal.registrar(
                'EQUIP_CRIAR',
                sessao.usuario.login,
                `codigo=${equipamento.codigoBarras} lote=${loteId} tipo=${tipo}`
            )
            this.equipamentos.salvar(equipamento)

            Mensagem.sucesso(`Equipamento cadastrado: ${equipamento.codigoBarras}`).imprimir()
            Mensagem.info('Proximo passo: concluir a triagem para liberar o fluxo.').imprimir()
            return
        }

        if (comando.subacao === 'listar') {
            const lista = comando.temOpcao('lote')
                ? this.equipamentos.listarPorLote(comando.opcao('lote'))
                : this.equipamentos.listar()

            Mensagem.info(`${lista.length} equipamento(s):`).imprimir()
            lista.forEach((equipamento) => console.log(`  ${equipamento.descrever()}`))
            return
        }

        if (comando.subacao === 'estado') {
            this.alterarEstadoFisico(comando, sessao)
            return
        }

        throw new Error('Subacao invalida. Use: equip criar | equip listar | equip estado')
    }

    private alterarEstadoFisico(comando: ComandoAnalisado, sessao: Sessao): void {
        const codigo = comando.posicionalObrigatorio(0, '<codigo de barras>')
        const equipamento = this.equipamentos.buscarPorCodigoBarras(codigo)

        if (equipamento === undefined) {
            throw new Error(`Equipamento '${codigo}' nao encontrado.`)
        }

        const novoEstado = estadoPorNome(comando.opcaoObrigatoria('para'))

        if (novoEstado === undefined) {
            throw new Error(`Estado invalido. Valores aceitos: ${estadosDisponiveis().join(', ')}.`)
        }

        const anterior = equipamento.estadoLegivel
        const justificativa = comando.opcao('motivo')

        equipamento.alterarEstado(novoEstado, justificativa)

        this.journal.registrar(
            'EQUIP_ESTADO',
            sessao.usuario.login,
            `codigo=${equipamento.codigoBarras} de=${anterior} para=${equipamento.estadoLegivel} motivo=${justificativa}`
        )
        this.equipamentos.salvar(equipamento)

        Mensagem.sucesso(
            `Estado alterado de ${anterior} para ${equipamento.estadoLegivel}.`
        ).imprimir()

        if (justificativa !== '') {
            Mensagem.info('Justificativa registrada no journal.').imprimir()
        }
    }

    private comandoTriagem(comando: ComandoAnalisado, sessao: Sessao): void {
        const codigo = comando.posicionalObrigatorio(0, '<codigo de barras>')
        const equipamento = this.equipamentos.buscarPorCodigoBarras(codigo)

        if (equipamento === undefined) {
            throw new Error(`Equipamento '${codigo}' nao encontrado.`)
        }

        const estado = estadoPorNome(comando.opcaoObrigatoria('estado'))

        if (estado === undefined) {
            throw new Error(`Estado invalido. Valores aceitos: ${estadosDisponiveis().join(', ')}.`)
        }

        const statusAnterior = equipamento.statusAtual
        equipamento.concluirTriagem(estado)

        this.journal.registrar(
            'TRIAGEM',
            sessao.usuario.login,
            `codigo=${equipamento.codigoBarras} estado=${equipamento.estadoLegivel}`
        )
        this.equipamentos.salvar(equipamento)
        this.movimentacoes.registrar(new Movimentacao(
            gerarId('MV'),
            equipamento.id,
            equipamento.codigoBarras,
            statusAnterior,
            equipamento.statusAtual,
            sessao.usuario.login,
            'triagem concluida'
        ))

        Mensagem.sucesso(
            `Triagem concluida. ${equipamento.codigoBarras} esta em ${equipamento.statusAtual}, estado ${equipamento.estadoLegivel}.`
        ).imprimir()
    }

    private comandoMover(comando: ComandoAnalisado, sessao: Sessao): void {
        const codigo = comando.posicionalObrigatorio(0, '<codigo de barras>')
        const equipamento = this.equipamentos.buscarPorCodigoBarras(codigo)

        if (equipamento === undefined) {
            throw new Error(`Equipamento '${codigo}' nao encontrado.`)
        }

        const destino = statusPorNome(comando.opcaoObrigatoria('para'))

        if (destino === undefined) {
            const permitidos = destinosPermitidos(equipamento.statusAtual)
            throw new Error(`Status invalido. A partir de ${equipamento.statusAtual}: ${permitidos.join(', ')}.`)
        }

        const anterior = equipamento.statusAtual
        equipamento.moverPara(destino)

        this.journal.registrar(
            'EQUIP_MOVER',
            sessao.usuario.login,
            `codigo=${equipamento.codigoBarras} de=${anterior} para=${destino}`
        )
        this.equipamentos.salvar(equipamento)
        this.movimentacoes.registrar(new Movimentacao(
            gerarId('MV'),
            equipamento.id,
            equipamento.codigoBarras,
            anterior,
            destino,
            sessao.usuario.login,
            comando.opcao('motivo')
        ))

        Mensagem.sucesso(`${equipamento.codigoBarras}: ${anterior} -> ${destino}.`).imprimir()
    }

    private comandoRastrear(comando: ComandoAnalisado): void {
        const codigo = comando.posicionalObrigatorio(0, '<codigo de barras>')
        this.rastreabilidade.rastrear(codigo).forEach((linha) => console.log(linha))
    }

    private comandoWallE(): void {
        const resgatados = this.equipamentos
            .listar()
            .filter((equipamento) => equipamento.statusAtual === StatusEquipamento.RECICLADO)

        console.log('')
        console.log('          .---------------------.')
        console.log('         /   .-----.   .-----.   ')
        console.log('        |   |  (o)  | |  (o)  |   |')
        console.log("        |    '-----'   '-----'    |")
        console.log('         \                       /')
        console.log("          '---------------------'")
        console.log('           |   W A L L - E   |')
        console.log('          [===]         [===]')
        console.log('')

        Mensagem.info('Waste Allocation Load Lifter - Earth Class').imprimir()
        Mensagem.info('Diretiva A-113: nada que ainda tenha valor termina em aterro.').imprimir()
        Mensagem.sucesso(
            `${resgatados.length} equipamento(s) resgatados do descarte ate agora.`
        ).imprimir()
    }

    private comandoRelatorio(comando: ComandoAnalisado): void {
        if (comando.subacao !== 'organizacao') {
            throw new Error('Subacao invalida. Use: relatorio organizacao <id>')
        }

        const id = comando.posicionalObrigatorio(0, '<id da organizacao>')
        this.rastreabilidade.resumoPorOrganizacao(id).forEach((linha) => console.log(linha))
    }

    private comandoJournal(comando: ComandoAnalisado): void {
        if (comando.subacao !== 'listar') {
            throw new Error('Subacao invalida. Use: journal listar')
        }

        const linhas = this.journal.listar(comando.opcao('filtro'), Number(comando.opcao('limite', '30')))

        Mensagem.info(`${linhas.length} registro(s) no journal:`).imprimir()
        linhas.forEach((linha) => console.log(`  ${linha}`))
    }

    private montarMenu(): Menu {
        const sessao = this.sessao

        if (sessao === null) {
            throw new Error('Nenhuma sessao aberta.')
        }

        switch (sessao.usuario.papel) {
            case 'ADMINISTRADOR':
                return new MenuAdministrador(sessao)
            case 'OPERADOR_CADASTRO':
                return new MenuOperador(sessao)
            case 'GESTOR_ALMOXARIFADO':
                return new MenuGestor(sessao)
            default:
                return new MenuAuditor(sessao)
        }
    }

    private abrirLeitor(): void {
        this.leitor = readline.createInterface({
            input: stdin,
            output: stdout,
            completer: (linha: string) => Aplicacao.completar(linha)
        })

        this.linhas = this.leitor[Symbol.asyncIterator]()

        this.carregarHistorico()
    }

    private async perguntar(rotulo: string): Promise<string | null> {
        stdout.write(rotulo)

        const leitura = await this.linhas.next()

        if (leitura.done === true) {
            stdout.write('\n')
            return null
        }

        return leitura.value
    }

    private async perguntarObrigatorio(rotulo: string): Promise<string> {
        const resposta = await this.perguntar(rotulo)

        if (resposta === null) {
            throw new Error('Entrada encerrada antes de o sistema receber os dados necessarios.')
        }

        return resposta
    }

    private static completar(linha: string): [string[], string] {
        const COMANDOS = [
            'ajuda', 'menu', 'sair',
            'usuario criar', 'usuario listar', 'usuario desativar',
            'config ver', 'config definir',
            'org criar', 'org listar', 'org ver',
            'contrato criar',
            'lote criar', 'lote listar', 'lote ver',
            'equip criar', 'equip listar', 'equip estado',
            'triagem', 'mover', 'rastrear',
            'relatorio organizacao',
            'journal listar'
        ]

        const encontrados = COMANDOS.filter((comando) => comando.startsWith(linha))
        return [encontrados.length > 0 ? encontrados : COMANDOS, linha]
    }

    private carregarHistorico(): void {
        if (!fs.existsSync(ARQUIVO_HISTORICO_CLI)) {
            return
        }

        const linhas = fs.readFileSync(ARQUIVO_HISTORICO_CLI, 'utf8')
            .split('\n')
            .filter((linha) => linha.trim() !== '')
            .slice(-100)

        const comHistorico = this.leitor as unknown as { history: string[] }
        comHistorico.history = linhas.reverse()
    }

    private salvarHistorico(): void {
        try {
            const comHistorico = this.leitor as unknown as { history: string[] }
            const linhas = [...(comHistorico.history ?? [])].reverse().slice(-100)

            fs.writeFileSync(ARQUIVO_HISTORICO_CLI, linhas.join('\n'), 'utf8')
        } catch {
        }
    }

    private imprimirCabecalho(): void {
        console.log('')
        console.log('  ####  ####  ####  ####  #  #   ###  ###  ###   ###')
        console.log('  #     #  #  #     #     ## #  #     #  # #  #  #  ')
        console.log('  # ##  ####  ###   ###   # ##  #     #  # #  #  ### ')
        console.log('  #  #  #  #  #     #     #  #  #     #  # #  #  #   ')
        console.log('  ####  #  #  ####  ####  #  #   ###  ###  ###   ###')
        console.log('')
        console.log('  Plataforma de logistica reversa de residuos eletronicos')
        console.log('')
    }

    private static textoDoErro(erro: unknown): string {
        return erro instanceof Error ? erro.message : String(erro)
    }
}
