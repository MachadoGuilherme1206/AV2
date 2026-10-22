-- CreateTable
CREATE TABLE `Configuracao` (
    `chave` VARCHAR(191) NOT NULL,
    `valor` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`chave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contrato` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(191) NOT NULL,
    `dataInicio` DATE NOT NULL,
    `dataFim` DATE NOT NULL,
    `periodicidadeDias` INTEGER NOT NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `organizacaoId` INTEGER NOT NULL,

    UNIQUE INDEX `Contrato_numero_key`(`numero`),
    UNIQUE INDEX `Contrato_organizacaoId_key`(`organizacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Equipamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigoBarrasInterno` VARCHAR(191) NOT NULL,
    `tipo` ENUM('COMPUTADOR', 'MONITOR', 'PERIFERICO') NOT NULL,
    `marca` VARCHAR(191) NOT NULL,
    `modelo` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `estado` ENUM('SUCATA', 'RUIM', 'REGULAR', 'BOM', 'NOVO') NULL,
    `status` ENUM('RECEBIDO', 'TRIADO', 'DESMONTE', 'RECICLADO', 'DESCARTADO') NOT NULL DEFAULT 'RECEBIDO',
    `versao` INTEGER NOT NULL DEFAULT 1,
    `loteId` INTEGER NOT NULL,

    UNIQUE INDEX `Equipamento_codigoBarrasInterno_key`(`codigoBarrasInterno`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `notaFiscal` VARCHAR(191) NOT NULL,
    `transportadora` VARCHAR(191) NOT NULL,
    `dataEntrada` DATE NOT NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `organizacaoId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Movimentacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `de` ENUM('RECEBIDO', 'TRIADO', 'DESMONTE', 'RECICLADO', 'DESCARTADO') NOT NULL,
    `para` ENUM('RECEBIDO', 'TRIADO', 'DESMONTE', 'RECICLADO', 'DESCARTADO') NOT NULL,
    `justificativa` VARCHAR(191) NOT NULL DEFAULT '',
    `dataHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `equipamentoId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `razaoSocial` VARCHAR(191) NOT NULL,
    `nomeFantasia` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NOT NULL,
    `logradouro` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `bairro` VARCHAR(191) NOT NULL,
    `cidade` VARCHAR(191) NOT NULL,
    `uf` VARCHAR(191) NOT NULL,
    `cep` VARCHAR(191) NOT NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `Organizacao_cnpj_key`(`cnpj`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `login` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(191) NOT NULL,
    `papel` ENUM('ADMINISTRADOR', 'OPERADOR_CADASTRO', 'GESTOR_ALMOXARIFADO', 'AUDITOR') NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `versao` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `Usuario_login_key`(`login`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Contrato` ADD CONSTRAINT `Contrato_organizacaoId_fkey` FOREIGN KEY (`organizacaoId`) REFERENCES `Organizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Equipamento` ADD CONSTRAINT `Equipamento_loteId_fkey` FOREIGN KEY (`loteId`) REFERENCES `Lote`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lote` ADD CONSTRAINT `Lote_organizacaoId_fkey` FOREIGN KEY (`organizacaoId`) REFERENCES `Organizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Movimentacao` ADD CONSTRAINT `Movimentacao_equipamentoId_fkey` FOREIGN KEY (`equipamentoId`) REFERENCES `Equipamento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Movimentacao` ADD CONSTRAINT `Movimentacao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
