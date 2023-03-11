# Queries

- I've these models: Client, ApiProvider, OriginServer, Endpoint, EndpointAccessGrant.
- ApiProvider owns many OriginServers
- Each OriginServer contains many Endpoints
- Each Client can request an EndpointAccessGrant, if approved by ApiProvider, the Client owns the EndpointAccessGrant and can share it with other clients

- there are two types of user: ApiProvider and Client, what's the best way to organize a UI for each of the user type
