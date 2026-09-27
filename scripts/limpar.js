/**
 * Apaga os dados gerados pelo greencode, devolvendo o sistema ao estado
 * anterior ao provisionamento.
 *
 * Escrito em JavaScript puro, e nao em TypeScript, de proposito: ele precisa
 * funcionar mesmo quando a pasta out/ foi apagada ou o projeto nao compila.
 *
 * Uso:  npm run limpar
 */

const fs = require('node:fs')
const path = require('node:path')

const RAIZ = path.join(__dirname, '..')
const PASTAS = ['config', 'data', 'logs']

console.log('')
console.log('Limpando o ambiente do greencode...')
console.log('')

let removidas = 0

for (const nome of PASTAS) {
    const caminho = path.join(RAIZ, nome)

    if (fs.existsSync(caminho)) {
        fs.rmSync(caminho, { recursive: true, force: true })
        console.log(`  removida: ${nome}/`)
        removidas++
    } else {
        console.log(`  ausente:  ${nome}/`)
    }
}

console.log('')

if (removidas === 0) {
    console.log('[INFO] Nada a remover. O ambiente ja estava limpo.')
} else {
    console.log('[SUCESSO] Ambiente limpo. A proxima execucao fara o provisionamento inicial.')
    console.log('[AVISO] A chave mestra foi apagada junto. Os dados anteriores sao irrecuperaveis.')
}

console.log('')
