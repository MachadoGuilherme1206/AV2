export enum Severidade {
    SUCESSO = 'SUCESSO',
    INFO = 'INFO',
    AVISO = 'AVISO',
    ERRO = 'ERRO',
    CRITICO = 'CRITICO'
}

export function prefixoDaSeveridade(severidade: Severidade): string {
    return `[${severidade}]`
}
