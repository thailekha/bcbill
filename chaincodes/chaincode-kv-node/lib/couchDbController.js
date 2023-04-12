
// write me a couchdb query to be used with the query function. It fetches all OriginServers belong to a providerEntityID, then for each found OriginServers
const query = async (ctx, query, opt = { formatResult: true }) => {
  let iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
  let result = await getIteratorData(iterator);
  if (opt.formatResult) {
    return result.reduce((result, item) => {
      addItemToArrayInObject(result, item.value.docType, item.value);
      return result;
    }, {});
  }
  return result;
};

const getIteratorData = async iterator => {
  let resultArray = [];

  while (true) {
    let res = await iterator.next();

    /*
    {
      "value": {
        "key": "9fac91710f9c590fc95a76e579dda05de79f67c8",
        "value": {
          "type": "Buffer",
          "data": [
            123,
            34,
            104,
            111,
            34
          ]
        }
      },
      "done": false
    }
     */

    //res.value -- contains other metadata
    //res.value.value -- contains the actual value
    //res.value.key -- contains the key

    let resJson = {};
    if (res.value && res.value.value.toString()) {
      resJson.value = JSON.parse(res.value.value.toString());

      // put the key into the value object
      resJson.value.id = res.value.key;
      resultArray.push(resJson);
    }

    if (res.done) {
      iterator.close();
      return resultArray;
    }
  }
};

const addItemToArrayInObject = (obj, arrayName, item) => {
  if (typeof obj[arrayName] === 'undefined')
    obj[arrayName] = [item];
  else
    obj[arrayName].push(item);
};

module.exports = {
  query
};