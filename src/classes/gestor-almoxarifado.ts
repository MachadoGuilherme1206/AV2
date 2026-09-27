import Usuario from './usuario'

export default class GestorAlmoxarifado extends Usuario {
    public override get papel(): string {
        return 'GESTOR_ALMOXARIFADO'
    }

    public override permissoes(): string[] {
        return [
            ...Usuario.COMANDOS_COMUNS,
            'lote',
            'equip',
            'triagem',
            'mover',
            'relatorio',
            'rastrear'
        ]
    }
}
