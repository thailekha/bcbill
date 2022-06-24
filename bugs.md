# TODO:
- use customer1@org1, org2. parse the email to figure out connection profile
- debug connectionProfileOrg1, go back to user org 1 and figure where the org is nested
- turn enroll wallet to in mem
- enroll customer 1 to org 1, customer 2 to org 2
- figure out creator
- hash the cert as part of the user
- stringify the read set and search for asset id

- how to know if it's a read
```
> JSON.stringify(readSet[1])
'{"chaincode":"chaincode1","set":[{"key":"171e107845f64d27905cae6543d75dad6d8fdf9d","version":{"block_num":{"low":8,"high":0,"unsigned":true},"tx_num":{"low":0,"high":0,"unsigned":true}}}]}'
```

- hash creator.id_bytes.toString(), use it to look for user --> email

# Node version
- 14 LTS

# Blockchain explorer
- the explorer uses systemchaincode plugin under the hood, specifically QSCC to query the blocks and traverse them
- For now, query its rest api at http://localhost:7010/api-docs/


# Discovery access denied
## Recreate
- more than 1 peer
- create network
- docker-compose logs to see peers failing to connect to gossip addresses
- notice the "
## Fix
- fablo-target/fabric-docker/docker-compose.yaml
- CORE_PEER_GOSSIP_BOOTSTRAP

# React-nodegui setup
# Install
- GCC
- cmake
- qt5

# New machine
- jq, docker, docker-compose v1

# Prog
- public / private key | password | email and profile

- provider is the admin
- customers sign contract with admin to register with their emails
- admin generate bunch of enrolment secrets
- cusomers register page:
	- email, secret, password
	- save identity

if there's email in localstoragfe--> logged in
- use the wallet as the login token?