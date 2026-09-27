import Usuario from './usuario'

export default class Auditor extends Usuario {
    public override get papel(): string {
        return 'AUDITOR'
    }

    public override permissoes(): string[] {
        return [
            ...Usuario.COMANDOS_COMUNS,
            'relatorio',
            'rastrear',
            'journal listar',
            'org listar',
            'lote listar',
            'equip listar'
        ]
    }
}
