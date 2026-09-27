import Aplicacao from './cli/aplicacao'

async function principal(): Promise<void> {
    const aplicacao = new Aplicacao()
    await aplicacao.iniciar()
}

principal().catch((erro) => {
    console.error(`[CRITICO] ${erro instanceof Error ? erro.message : String(erro)}`)
    process.exit(1)
})
