import Usuario from './usuario'

export default class OperadorCadastro extends Usuario {
    public override get papel(): string {
        return 'OPERADOR_CADASTRO'
    }

    public override permissoes(): string[] {
        return [
            ...Usuario.COMANDOS_COMUNS,
            'org',
            'contrato',
            'relatorio',
            'rastrear'
        ]
    }
}
