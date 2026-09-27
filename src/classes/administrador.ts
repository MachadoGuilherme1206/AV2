import Usuario from './usuario'

export default class Administrador extends Usuario {
    public override get papel(): string {
        return 'ADMINISTRADOR'
    }

    public override permissoes(): string[] {
        return ['*']
    }
}
