const query = async (ctx, query, opt = { formatResult: true }) => {
  let iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
  let result = await getIteratorData(iterator);
  if (opt.formatResult) {
    return result.reduce((result, item) => {
      addItemToArrayInObject(result, item.value.docType + 's', item.value);
      return result;
    }, {});
  }
  return result;
};

const getIteratorData = async iterator => {
  let resultArray = [];

  while (true) {
    let res = await iterator.next();

    //res.value -- contains other metadata
    //res.value.value -- contains the actual value
    //res.value.key -- contains the key

    let resJson = {};
    if (res.value && res.value.value.toString()) {
      resJson.key = res.value.key;
      resJson.value = JSON.parse(res.value.value.toString());
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