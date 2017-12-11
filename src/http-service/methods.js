const { isArray } = require('../utils/is-type')

const Methods = {
  get: 'get',
  post: 'post',
  put: 'put',
  patch: 'patch',
  delete: 'delete',
  get1: 'get',
  batchPut: 'put',
  batchPatch: 'patch',
  batchDelete: 'delete'
}
const defaultMethods = ['get', 'get1', 'post', 'put', 'patch']

function prepareAttributes (attributesQuery, Model) {
  const ret = []
  const arr = attributesQuery.split(',')
  for (let i = 0, len = arr.length; i < len; i++) {
    const s = arr[i].trim()
    if (s !== '' && Model.attributesOptions[s]) ret.push(s)
  }
  return ret
}

async function prepareValues (data, Model, isPostMethod) {
  const attributes = Model.attributesOptions
  const values = {}

  for (let key in attributes) {
    if (data[key] !== undefined) {
      values[key] = data[key]
    } else if (
      key === Model.primaryKeyAttribute &&
      isPostMethod &&
      Model.idGenerator
    ) {
      values[key] = await Model.idGenerator()
    }
  }
  return values
}

async function prepareValuesArray (data, Model, isPostMethod) {
  const valuesArray = []
  if (isArray(data)) {
    const count = data.length
    let ids
    if (isPostMethod && Model.idGenerator && Model.primaryKeyAttribute) {
      ids = await Model.idGenerator(count)
    }
    for (let i = 0; i < count; i++) {
      const item = data[i]
      if (
        ids &&
        ids.length > i &&
        item[Model.primaryKeyAttribute] === undefined
      ) {
        item[Model.primaryKeyAttribute] = ids[i]
      }
      valuesArray.push(await prepareValues(item, Model))
    }
  } else {
    return prepareValues(data, Model, isPostMethod)
  }
}

async function getModels (ctx, next, Model) {
  const limit = ctx.query.limit || 100
  const offset = ctx.query.offset || 0
  const queryOptions = {
    limit,
    offset
  }
  if (ctx.query.fields) {
    queryOptions.attributes = prepareAttributes(ctx.query.fields, Model)
  }
  ctx.body = await Model.findAll(queryOptions)
}

async function getModel (ctx, next, Model, id) {
  ctx.body = await Model.findById(id)
}

async function postModel (ctx, next, Model) {
  const primaryKey = Model.primaryKeyAttribute
  let ret
  if (isArray(ctx.request.body)) {
    const dataArr = await prepareValuesArray(ctx.request.body, Model, true)
    ret = []
    for (let i = 0, len = dataArr.length; i < len; i++) {
      ret.push(await Model.create(dataArr[i])[primaryKey])
    }
  } else {
    const data = await prepareValues(ctx.request.body, Model, true)
    ret = await Model.create(data)[primaryKey]
  }
  ctx.body = ret
}

async function updateModel (ctx, next, Model, id) {
  const data = prepareValues(ctx.request.body, Model)
  const queryOptions = {}
  queryOptions[Model.primaryKeyAttribute] = id
  await Model.update(data, {
    where: queryOptions
  })
}

async function updateModels (ctx, next, Model) {
  const data = await prepareValuesArray(ctx.request.body, Model)
  for (let i = 0, len = data.length; i < len; i++) {
    const queryOptions = {}
    queryOptions[Model.primaryKeyAttribute] = data[Model.primaryKeyAttribute]
    await Model.update(data, {
      where: queryOptions
    })
  }
}

async function deleteModel (ctx, next, Model, id) {
  const queryOptions = {}
  queryOptions[Model.primaryKeyAttribute] = id
  await Model.destroy({
    where: queryOptions
  })
}

const procedures = {
  get: getModels,
  get1: getModel,
  post: postModel,
  put: updateModel,
  patch: updateModel,
  batchPut: updateModels,
  batchPatch: updateModels,
  delete: deleteModel
  // batchDelete: deleteModels
}

function defineMethods (name, methods) {
  const this$ = this
  ;(methods || defaultMethods).forEach(method => {
    this$[Methods[method]](name, procedures[method])
  })
}

module.exports = {
  Methods,
  defineMethods
}
