export enum EstadoFisico {
    SUCATA = 1,
    RUIM = 2,
    REGULAR = 3,
    BOM = 4,
    NOVO = 5
}

export function nomeDoEstado(estado: EstadoFisico): string {
    return EstadoFisico[estado]
}

export function estadoPorNome(nome: string): EstadoFisico | undefined {
    const procurado = nome.trim().toUpperCase()
    const encontrado = Object.keys(EstadoFisico).find((chave) => chave === procurado)

    if (encontrado === undefined) {
        return undefined
    }
    return EstadoFisico[encontrado as keyof typeof EstadoFisico]
}

export function estadosDisponiveis(): string[] {
    return ['NOVO', 'BOM', 'REGULAR', 'RUIM', 'SUCATA']
}
