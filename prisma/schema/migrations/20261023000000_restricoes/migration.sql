-- Regras que o proprio banco garante, mesmo se alguem gravar sem passar pela API.

-- Um equipamento so pode sair de RECEBIDO depois de ter o estado fisico definido na triagem.
ALTER TABLE `Equipamento` ADD CONSTRAINT `Equipamento_triagem_check` CHECK (`status` = 'RECEBIDO' OR `estado` IS NOT NULL);
ALTER TABLE `Equipamento` ADD CONSTRAINT `Equipamento_valor_check` CHECK (`valor` >= 0);

-- Contrato precisa terminar depois de comecar e ter periodicidade positiva.
ALTER TABLE `Contrato` ADD CONSTRAINT `Contrato_datas_check` CHECK (`dataFim` > `dataInicio`);
ALTER TABLE `Contrato` ADD CONSTRAINT `Contrato_periodicidade_check` CHECK (`periodicidadeDias` > 0);
