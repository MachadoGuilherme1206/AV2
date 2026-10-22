import bcrypt from 'bcryptjs'
import { EstadoFisico, Papel, StatusEquipamento, TipoEquipamento } from '@prisma/client'
import prisma from './prisma'

const diasAtras = (dias: number) => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dias)
}

const criarUsuarios = async () => {
    const usuarios = [
        { login: 'admin', senha: 'viuvanegra', papel: Papel.ADMINISTRADOR },
        { login: 'operador', senha: 'operador123', papel: Papel.OPERADOR_CADASTRO },
        { login: 'gestor', senha: 'gestor123', papel: Papel.GESTOR_ALMOXARIFADO },
        { login: 'auditor', senha: 'auditor123', papel: Papel.AUDITOR }
    ]

    for (const usuario of usuarios) {
        await prisma.usuario.create({
            data: {
                login: usuario.login,
                senhaHash: await bcrypt.hash(usuario.senha, 10),
                papel: usuario.papel
            }
        })
        console.log(`Usuario ${usuario.login} / ${usuario.senha} (${usuario.papel})`)
    }
}

// Cria o equipamento ja no status final e grava cada passo do caminho como movimentacao.
const criarEquipamento = async (
    loteId: number,
    gestorId: number,
    codigo: string,
    tipo: TipoEquipamento,
    marca: string,
    modelo: string,
    valor: number,
    caminho: StatusEquipamento[],
    estado: EstadoFisico | null
) => {
    const equipamento = await prisma.equipamento.create({
        data: {
            codigoBarrasInterno: codigo,
            tipo,
            marca,
            modelo,
            valor,
            loteId,
            estado,
            status: caminho[caminho.length - 1]
        }
    })

    for (let i = 1; i < caminho.length; i++) {
        await prisma.movimentacao.create({
            data: {
                equipamentoId: equipamento.id,
                usuarioId: gestorId,
                de: caminho[i - 1],
                para: caminho[i],
                justificativa: caminho[i] === 'TRIADO' ? 'triagem concluida' : ''
            }
        })
    }
}

const popular = async () => {
    await criarUsuarios()
    const gestor = await prisma.usuario.findUniqueOrThrow({ where: { login: 'gestor' } })

    await prisma.configuracao.createMany({
        data: [
            { chave: 'aliquota.icms', valor: '18' },
            { chave: 'aliquota.iss', valor: '5' },
            { chave: 'depreciacao.mensal', valor: '2.5' }
        ]
    })

    const alfa = await prisma.organizacao.create({
        data: {
            razaoSocial: 'COMERCIAL ALFA LTDA',
            nomeFantasia: 'Alfa Varejo',
            cnpj: '11222333000181',
            logradouro: 'Avenida Brasil',
            numero: '1500',
            bairro: 'Centro',
            cidade: 'Sao Jose dos Campos',
            uf: 'SP',
            cep: '12210000',
            contrato: {
                create: {
                    numero: 'CT-2026-001',
                    dataInicio: diasAtras(120),
                    dataFim: diasAtras(-245),
                    periodicidadeDias: 30
                }
            }
        }
    })

    const beta = await prisma.organizacao.create({
        data: {
            razaoSocial: 'HOSPITAL BETA S.A.',
            nomeFantasia: 'Hospital Beta',
            cnpj: '98765432000198',
            logradouro: 'Rua das Flores',
            numero: '200',
            bairro: 'Jardim Paulista',
            cidade: 'Taubate',
            uf: 'SP',
            cep: '12020000'
        }
    })

    const lote1 = await prisma.lote.create({
        data: { organizacaoId: alfa.id, notaFiscal: '123456', transportadora: 'TransRapida', dataEntrada: diasAtras(20) }
    })

    const lote2 = await prisma.lote.create({
        data: { organizacaoId: beta.id, notaFiscal: '654321', transportadora: 'LogVerde', dataEntrada: diasAtras(75) }
    })

    await criarEquipamento(lote1.id, gestor.id, 'GC-COMP-0001', 'COMPUTADOR', 'Dell', 'Optiplex 3080', 2500,
        ['RECEBIDO'], null)
    await criarEquipamento(lote1.id, gestor.id, 'GC-COMP-0002', 'COMPUTADOR', 'Lenovo', 'ThinkCentre M70', 1800,
        ['RECEBIDO', 'TRIADO'], 'BOM')
    await criarEquipamento(lote1.id, gestor.id, 'GC-MON-0001', 'MONITOR', 'Samsung', 'S22F350', 600,
        ['RECEBIDO', 'TRIADO', 'DESMONTE'], 'REGULAR')
    await criarEquipamento(lote1.id, gestor.id, 'GC-PER-0001', 'PERIFERICO', 'Logitech', 'Teclado K120', 80,
        ['RECEBIDO', 'TRIADO', 'DESCARTADO'], 'SUCATA')
    await criarEquipamento(lote2.id, gestor.id, 'GC-COMP-0003', 'COMPUTADOR', 'HP', 'ProDesk 400', 2200,
        ['RECEBIDO', 'TRIADO', 'DESMONTE', 'RECICLADO'], 'RUIM')
    await criarEquipamento(lote2.id, gestor.id, 'GC-MON-0002', 'MONITOR', 'LG', 'Flatron CRT', 200,
        ['RECEBIDO'], null)

    console.log('Dados de exemplo: 2 organizacoes, 2 lotes, 6 equipamentos.')
}

popular()
    .catch((erro) => {
        console.error(erro)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
