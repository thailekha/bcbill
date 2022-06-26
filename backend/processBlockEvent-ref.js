async processBlockEvent(client, block, noDiscovery) {
    const network_id = client.getNetworkId();
    // Get the first transaction
    const first_tx = block.data.data[0];
    // The 'header' object contains metadata of the transaction
    const header = first_tx.payload.header;
    const channel_name = header.channel_header.channel_id;
    const blockPro_key = `${channel_name}_${block.header.number.toString()}`;

    logger.debug('New Block  >>>>>>> %j', block.header.number);
    const channel_genesis_hash = client.getChannelGenHash(channel_name);
    // Checking block is channel CONFIG block
    /* eslint-disable */
    if (!channel_genesis_hash) {
        // get discovery and insert channel details to db and create new channel object in client context
        setTimeout(
            async (cli, chName, blk) => {
                await this.insertDiscoveredChannel(cli, chName, blk);
            },
            10000,
            client,
            channel_name,
            block
        );
        logger.warn('Insert discovered new channel', channel_name);
        throw new ExplorerError(`${channel_name} has not been inserted yet`);
    }

    if (this.blocksInProcess.includes(blockPro_key)) {
        throw new ExplorerError('Block already in processing');
    }
    this.blocksInProcess.push(blockPro_key);

    if (
        !noDiscovery &&
        header.channel_header.typeString === fabric_const.BLOCK_TYPE_CONFIG
    ) {
        setTimeout(
            async (cli, chName, chGenHash) => {
                await this.updateDiscoveredChannel(cli, chName, chGenHash);
            },
            10000,
            client,
            channel_name,
            channel_genesis_hash
        );
    }

    const createdt = await FabricUtils.getBlockTimeStamp(
        header.channel_header.timestamp
    );
    const blockhash = await FabricUtils.generateBlockHash(block.header);
    const block_row = {
        blocknum: block.header.number.toString(),
        datahash: block.header.data_hash.toString('hex'),
        prehash: block.header.previous_hash.toString('hex'),
        txcount: block.data.data.length,
        createdt,
        prev_blockhash: '',
        blockhash,
        channel_genesis_hash,
        blksize: jsonObjSize(block)
    };
    const txLen = block.data.data.length;
    for (let txIndex = 0; txIndex < txLen; txIndex++) {
        const txObj = block.data.data[txIndex];
        const txStr = JSON.stringify(txObj);
        const size = Buffer.byteLength(txStr);
        let txid = txObj.payload.header.channel_header.tx_id;

        let validation_code = '';
        let endorser_signature = '';
        let payload_proposal_hash = '';
        let endorser_id_bytes = '';
        let chaincode_proposal_input = '';
        let chaincode = '';
        let rwset;
        let readSet;
        let writeSet;
        let chaincodeID;
        let status;
        let mspId = [];

        this.convertFormatOfValue(
            'value',
            client.fabricGateway.fabricConfig.getRWSetEncoding(),
            txObj
        );
        if (txid && txid !== '') {
            const validation_codes =
                block.metadata.metadata[
                    fabprotos.common.BlockMetadataIndex.TRANSACTIONS_FILTER
                ];
            const val_code = validation_codes[txIndex];
            validation_code = convertValidationCode(val_code);
        }
        let envelope_signature = txObj.signature;
        if (envelope_signature !== undefined) {
            envelope_signature = Buffer.from(envelope_signature).toString('hex');
        }
        let payload_extension = txObj.payload.header.channel_header.extension;
        if (payload_extension !== undefined) {
            payload_extension = Buffer.from(payload_extension).toString('hex');
        }
        let creator_nonce = txObj.payload.header.signature_header.nonce;
        if (creator_nonce !== undefined) {
            creator_nonce = Buffer.from(creator_nonce).toString('hex');
        }
        /* eslint-disable */
        const creator_id_bytes =
            txObj.payload.header.signature_header.creator.id_bytes;
        if (txObj.payload.data.actions !== undefined) {
            chaincode =
                txObj.payload.data.actions[0].payload.action.proposal_response_payload
                    .extension.chaincode_id.name;
            chaincodeID = new Uint8Array(
                txObj.payload.data.actions[0].payload.action.proposal_response_payload.extension
            );
            status =
                txObj.payload.data.actions[0].payload.action.proposal_response_payload
                    .extension.response.status;
            mspId = txObj.payload.data.actions[0].payload.action.endorsements.map(
                endorsement => endorsement.endorser.mspid
            );
            rwset =
                txObj.payload.data.actions[0].payload.action.proposal_response_payload
                    .extension.results.ns_rwset;
            readSet = rwset.map(rw => ({
                chaincode: rw.namespace,
                set: rw.rwset.reads
            }));
            writeSet = rwset.map(rw => ({
                chaincode: rw.namespace,
                set: rw.rwset.writes
            }));
            chaincode_proposal_input =
                txObj.payload.data.actions[0].payload.chaincode_proposal_payload.input
                    .chaincode_spec.input.args;
            if (chaincode_proposal_input !== undefined) {
                let inputs = '';
                for (const input of chaincode_proposal_input) {
                    inputs =
                        (inputs === '' ? inputs : `${inputs},`) +
                        Buffer.from(input).toString('hex');
                }
                chaincode_proposal_input = inputs;
            }
            endorser_signature =
                txObj.payload.data.actions[0].payload.action.endorsements[0].signature;
            if (endorser_signature !== undefined) {
                endorser_signature = Buffer.from(endorser_signature).toString('hex');
            }
            payload_proposal_hash = txObj.payload.data.actions[0].payload.action.proposal_response_payload.proposal_hash.toString(
                'hex'
            );
            endorser_id_bytes =
                txObj.payload.data.actions[0].payload.action.endorsements[0].endorser
                    .IdBytes;
        }

        if (txObj.payload.header.channel_header.typeString === 'CONFIG') {
            txid = sha.sha256(txStr);
            readSet =
                txObj.payload.data.last_update.payload?.data.config_update.read_set;
            writeSet =
                txObj.payload.data.last_update.payload?.data.config_update.write_set;
        }

        const read_set = JSON.stringify(readSet, null, 2);
        const write_set = JSON.stringify(writeSet, null, 2);

        const chaincode_id = String.fromCharCode.apply(null, chaincodeID);
        // checking new chaincode is deployed
        if (
            !noDiscovery &&
            header.channel_header.typeString ===
                fabric_const.BLOCK_TYPE_ENDORSER_TRANSACTION &&
            (chaincode === fabric_const.CHAINCODE_LSCC ||
                chaincode === fabric_const.CHAINCODE_LIFECYCLE)
        ) {
            setTimeout(
                async (cli, chName, chGenHash) => {
                    // get discovery and insert chaincode details to db
                    await this.insertFromDiscoveryResults(cli, chName, chGenHash);

                    const notify = {
                        notify_type: fabric_const.NOTITY_TYPE_CHAINCODE,
                        network_id,
                        channel_name: chName
                    };

                    this.platform.send(notify);
                },
                10000,
                client,
                channel_name,
                channel_genesis_hash
            );
        }
        /* eslint-enable */
        const transaction_row = {
            blockid: block.header.number.toString(),
            txhash: txid,
            createdt: txObj.payload.header.channel_header.timestamp,
            chaincodename: chaincode,
            chaincode_id,
            status,
            creator_msp_id: txObj.payload.header.signature_header.creator.mspid,
            endorser_msp_id: mspId,
            type: txObj.payload.header.channel_header.typeString,
            read_set,
            write_set,
            channel_genesis_hash,
            validation_code,
            envelope_signature,
            payload_extension,
            creator_nonce,
            chaincode_proposal_input,
            endorser_signature,
            creator_id_bytes,
            payload_proposal_hash,
            endorser_id_bytes
        };

        // Insert transaction

        const res = await this.persistence
            .getCrudService()
            .saveTransaction(network_id, transaction_row);
        logger.debug('saveTransaction ', res);
    }

    // Insert block
    logger.info('block_row.blocknum ', block_row.blocknum);
    const successSaveBlock = await this.persistence
        .getCrudService()
        .saveBlock(network_id, block_row);
    logger.debug('result of SaveBlock ', successSaveBlock);

    if (successSaveBlock) {
        // Push last block
        const notify = {
            notify_type: fabric_const.NOTITY_TYPE_BLOCK,
            network_id,
            channel_name,
            title: `Block ${block.header.number.toString()} added to Channel: ${channel_name}`,
            type: 'block',
            message: `Block ${block.header.number.toString()} established with ${
                block.data.data.length
            } tx`,
            time: createdt,
            txcount: block.data.data.length,
            datahash: block.header.data_hash.toString('hex'),
            blksize: block_row.blksize
        };

        this.platform.send(notify);
    }

    const index = this.blocksInProcess.indexOf(blockPro_key);
    this.blocksInProcess.splice(index, 1);
    return true;
}
