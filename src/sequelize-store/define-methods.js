const { isArray } = require('../utils/check-type')
const HttpMethods = require('../constant/http-methods')

function attributesQuery2Array (query) {
  const result = []
  const len = query.length
  let depth = 0
  let w = ''
  let v = ''
  let i = 0
  for (; i < len; i++) {
    let c = query[i]
    if (c === ' ') continue
    if (c === '(') {
      depth++
      if (depth === 1) continue
    } else if (c === ')') {
      depth--
      if (depth === 0) continue
    }
    if (depth === 0) {
      if (c === ',') {
        result.push(
          v === ''
            ? w
            : {
              model: w,
              attributes: attributesQuery2Array(v)
            }
        )
        w = ''
        v = ''
      } else {
        w += c
      }
    } else {
      v += c
    }
  }
  if (depth === 0 && w !== '') {
    result.push(
      v === ''
        ? w
        : {
          model: w,
          attributes: attributesQuery2Array(v)
        }
    )
  }
  return result
}

function prepareAttributes (attributesQuery, Model) {
  const result = []
  const arr = attributesQuery && attributesQuery !== '*'
    ? attributesQuery.split(',')
    : Object.keys(Model.attributesOptions)
  for (let i = 0, len = arr.length; i < len; i++) {
    const s = arr[i].trim()
    if (s !== '' && (!attributesQuery || Model.attributesOptions[s])) {
      result.push(s)
    }
  }
  return result
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

async function getModels (ctx, next, Model, id) {
  const options = {
    attributes: prepareAttributes(ctx.query.fields, Model)
  }
  if (id === undefined) {
    options.limit = ctx.query.limit || 100
    options.offset = ctx.query.offset || 0
  }
  ctx.body = id === undefined
    ? await Model.findAll(options)
    : await Model.findById(id, options)
}

async function postModels (ctx, next, Model) {
  const primaryKey = Model.primaryKeyAttribute
  let ret
  if (isArray(ctx.request.body)) {
    const dataArr = await prepareValuesArray(ctx.request.body, Model, true)
    ret = []
    for (let i = 0, len = dataArr.length; i < len; i++) {
      ret.push((await Model.create(dataArr[i]))[primaryKey])
    }
  } else {
    const data = await prepareValues(ctx.request.body, Model, true)
    ret = (await Model.create(data))[primaryKey]
  }
  ctx.body = ret
}

async function updateModels (ctx, next, Model, id) {
  const primaryKey = Model.primaryKeyAttribute
  if (isArray(ctx.request.body)) {
    const dataArr = await prepareValuesArray(ctx.request.body, Model)
    for (let i = 0, len = dataArr.length; i < len; i++) {
      const queryOptions = {}
      queryOptions[primaryKey] = dataArr[i][primaryKey]
      await Model.update(dataArr[i], { where: queryOptions })
    }
  } else {
    const data = await prepareValues(ctx.request.body, Model)
    const queryOptions = {}
    queryOptions[primaryKey] = id === undefined ? data[primaryKey] : id
    await Model.update(data, { where: queryOptions })
  }
  ctx.body = 'ok'
}

async function deleteModels (ctx, next, Model, id) {
  const queryOptions = {}
  if (id !== undefined) queryOptions[Model.primaryKeyAttribute] = id
  await Model.destroy({ where: queryOptions })
}

const procedures = {
  get: getModels,
  post: postModels,
  put: updateModels,
  patch: updateModels,
  delete: deleteModels
}

function defineMethods (nest, modelName, methods) {
  if (!methods) {
    methods = HttpMethods.concat()
    methods.splice(methods.indexOf('delete'))
  }
  methods.forEach(method => {
    nest[method](modelName, procedures[method])
  })
}

module.exports = defineMethods
