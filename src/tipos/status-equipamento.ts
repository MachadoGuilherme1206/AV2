export enum StatusEquipamento {
    RECEBIDO = 'RECEBIDO',
    TRIADO = 'TRIADO',
    DESMONTE = 'DESMONTE',
    RECICLADO = 'RECICLADO',
    DESCARTADO = 'DESCARTADO'
}

const TRANSICOES: Record<StatusEquipamento, StatusEquipamento[]> = {
    [StatusEquipamento.RECEBIDO]: [StatusEquipamento.TRIADO],
    [StatusEquipamento.TRIADO]: [StatusEquipamento.DESMONTE, StatusEquipamento.DESCARTADO],
    [StatusEquipamento.DESMONTE]: [StatusEquipamento.RECICLADO],
    [StatusEquipamento.RECICLADO]: [],
    [StatusEquipamento.DESCARTADO]: []
}

export function destinosPermitidos(atual: StatusEquipamento): StatusEquipamento[] {
    return TRANSICOES[atual]
}

export function statusFinal(status: StatusEquipamento): boolean {
    return TRANSICOES[status].length === 0
}

export function statusPorNome(nome: string): StatusEquipamento | undefined {
    const procurado = nome.trim().toUpperCase()
    const encontrado = Object.values(StatusEquipamento).find((valor) => valor === procurado)
    return encontrado
}
