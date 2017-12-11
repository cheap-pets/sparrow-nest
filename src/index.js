const Sequelize = require('sequelize')
const defineSequelizeModel = require('./sequelize/define-model')
const resolve = require('./utils/resolve-path')
const Types = require('./utils/data-types')

const { HttpService } = require('henhouse')
const { Methods, defineMethods } = require('./http-service/methods')
const { TableNameMode, FieldNameMode } = require('./utils/name-mode')

function getSequelizeInstance (v) {
  return v instanceof Sequelize ? v : new Sequelize(v)
}

class Nest {
  constructor (options) {
    if (options.sequelize) {
      this.sequelize = getSequelizeInstance(options.sequelize)
    }[
      'path',
      'tableNameMode',
      'fieldNameMode'
    ].forEach(n => {
      options[n] && (this[n] = options[n])
    })
    this.httpService = new HttpService()
    this.models = {}
  }
  defineModel (name, attributes, options) {
    const sequelize = options.sequelize
      ? getSequelizeInstance(options.sequelize)
      : this.sequelize
    options = Object.assign(
      {
        tableNameMode: this.tableNameMode,
        fieldNameMode: this.fieldNameMode
      },
      options
    )
    const Model = defineSequelizeModel(sequelize, name, attributes, options)
    Model.path = options.path || name + 's'
    Model.idGenerator = options.idGenerator
    this.models[name] = Model
    if (options.methods !== false || options.methods === undefined) {
      defineMethods.call(this, name, options.methods)
    }
    return Model
  }
  listen (port) {
    this.httpService.listen(port)
    return this
  }
  close () {
    this.httpService.close()
    return this
  }
}
/**
 * @name get|get1|put|post|patch|delete|batchPut|batchPatch
 * @memberof module: sparrow-nest.prototype
 * @param { String } model name or path
 * @param { Function } callback route callback
 * @returns { Nest }
 */
Object.keys(Methods).forEach(method => {
  Nest.prototype[method] = function (path, nestKoaMiddleware) {
    const Model = this.models[path]
    let parseId = false
    if (Model) {
      path = Model.path
      if (['put', 'patch', 'delete', 'get1'].indexOf(method) >= 0) {
        path += '/:id'
        parseId = true
      }
      path = (this.path || '') + '/' + path
    }
    path = resolve(path)
    this.httpService[Methods[method]](path, async (ctx, next) => {
      await nestKoaMiddleware(
        ctx,
        next,
        Model,
        parseId ? ctx.params.id : undefined
      )
    })
    return this
  }
})

Nest.TableNameMode = TableNameMode
Nest.FieldNameMode = FieldNameMode
Nest.DataTypes = Types

module.exports = Nest
