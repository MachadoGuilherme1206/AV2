import RepositorioArquivo, { RegistroBruto } from './repositorio-arquivo'
import Organizacao from '../classes/organizacao'
import Endereco from '../classes/endereco'
import ContratoColeta from '../classes/contrato-coleta'
import ValidadorCNPJ from '../validadores/validador-cnpj'

export default class RepositorioOrganizacao extends RepositorioArquivo {
    public override get nomeArquivo(): string {
        return 'organizacoes.enc'
    }

    public salvar(organizacao: Organizacao): void {
        const registros = this.lerRegistros()
        const posicao = registros.findIndex((registro) => registro.id === organizacao.id)
        const novo = RepositorioOrganizacao.paraRegistro(organizacao)

        if (posicao >= 0) {
            registros[posicao] = novo
        } else {
            registros.push(novo)
        }

        this.salvarRegistros(registros)
    }

    public buscarPorId(id: string): Organizacao | undefined {
        const registro = this.lerRegistros()
            .find((item) => item.id === id.trim().toUpperCase())

        return registro === undefined ? undefined : RepositorioOrganizacao.deRegistro(registro)
    }

    public cnpjJaCadastrado(cnpj: string): string | undefined {
        const procurado = ValidadorCNPJ.apenasDigitos(cnpj)
        const registro = this.lerRegistros().find((item) => item.cnpj === procurado)

        return registro === undefined ? undefined : registro.id
    }

    public listar(): Organizacao[] {
        return this.lerRegistros().map((registro) => RepositorioOrganizacao.deRegistro(registro))
    }

    private static paraRegistro(organizacao: Organizacao): RegistroBruto {
        return {
            id: organizacao.id,
            razaoSocial: organizacao.razaoSocialFormatada,
            nomeFantasia: organizacao.nomeFantasia,
            cnpj: organizacao.cnpjLimpo,
            endereco: {
                logradouro: organizacao.endereco.logradouro,
                numero: organizacao.endereco.numero,
                bairro: organizacao.endereco.bairro,
                cidade: organizacao.endereco.cidade,
                uf: organizacao.endereco.uf,
                cep: organizacao.endereco.cep
            },
            contratos: organizacao.listarContratos().map((contrato) => ({
                numero: contrato.numero,
                dataInicio: contrato.dataInicio.toISOString(),
                dataFim: contrato.dataFim.toISOString(),
                periodicidadeDias: contrato.periodicidadeDias
            }))
        }
    }

    private static deRegistro(registro: RegistroBruto): Organizacao {
        const endereco = new Endereco(
            registro.endereco.logradouro,
            registro.endereco.numero,
            registro.endereco.bairro,
            registro.endereco.cidade,
            registro.endereco.uf,
            registro.endereco.cep
        )

        const organizacao = new Organizacao(
            registro.id,
            registro.razaoSocial,
            registro.nomeFantasia,
            registro.cnpj,
            endereco
        )

        for (const contrato of registro.contratos ?? []) {
            organizacao.adicionarContrato(new ContratoColeta(
                contrato.numero,
                new Date(contrato.dataInicio),
                new Date(contrato.dataFim),
                contrato.periodicidadeDias
            ))
        }

        return organizacao
    }
}
