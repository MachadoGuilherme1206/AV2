import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import * as fs from 'node:fs'
import { ARQUIVO_CHAVE, prepararPastas } from '../util/caminhos'

export default class ServicoCriptografia {
    private static readonly ALGORITMO = 'aes-256-cbc'
    private static readonly TAMANHO_CHAVE = 32
    private static readonly TAMANHO_IV = 16

    private readonly chave: Buffer

    constructor(chaveHex: string) {
        const chave = Buffer.from(chaveHex, 'hex')

        if (chave.length !== ServicoCriptografia.TAMANHO_CHAVE) {
            throw new Error(
                'Chave mestra invalida: o AES-256 exige 32 bytes (64 caracteres hexadecimais).'
            )
        }
        this.chave = chave
    }

    public cifrar(texto: string): string {
        const iv = randomBytes(ServicoCriptografia.TAMANHO_IV)
        const cifrador = createCipheriv(ServicoCriptografia.ALGORITMO, this.chave, iv)

        const cifrado = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()])

        return `${iv.toString('hex')}:${cifrado.toString('hex')}`
    }

    public decifrar(conteudo: string): string {
        const partes = conteudo.split(':')

        if (partes.length !== 2) {
            throw new Error('Arquivo de dados corrompido: formato do conteudo cifrado invalido.')
        }

        const iv = Buffer.from(partes[0], 'hex')
        const cifrado = Buffer.from(partes[1], 'hex')
        const decifrador = createDecipheriv(ServicoCriptografia.ALGORITMO, this.chave, iv)

        return Buffer.concat([decifrador.update(cifrado), decifrador.final()]).toString('utf8')
    }

    public static gerarHash(senha: string): string {
        return createHash('sha256').update(senha, 'utf8').digest('hex')
    }

    public static gerarChave(): string {
        return randomBytes(ServicoCriptografia.TAMANHO_CHAVE).toString('hex')
    }

    public static chaveExiste(): boolean {
        return fs.existsSync(ARQUIVO_CHAVE)
    }

    public static salvarChave(chaveHex: string): void {
        prepararPastas()
        fs.writeFileSync(ARQUIVO_CHAVE, chaveHex, { encoding: 'utf8', mode: 0o600 })
    }

    public static carregarChave(): string {
        if (!ServicoCriptografia.chaveExiste()) {
            throw new Error(
                'Chave mestra nao encontrada. Execute o provisionamento inicial do sistema.'
            )
        }
        return fs.readFileSync(ARQUIVO_CHAVE, 'utf8').trim()
    }
}
