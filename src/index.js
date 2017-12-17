const {
  DataTypes,
  StoreTypes,
  TableNameMode,
  FieldNameMode,
  HttpMethods
} = require('./constants')

const SequelizeStore = require('./sequelize-store/index')

const resolve = require('./utils/resolve-path')
const { HttpService } = require('henhouse')

function getDefaultModelPath (modelName) {
  return modelName.replace(/([A-Z])/g, '-$1').toLowerCase() + 's'
}

class Nest {
  constructor (options) {
    this.stores = {}
    this.registerStores(options.stores)
    if (options.sequelize) {
      this.stores.sequelize = new SequelizeStore(this, options.sequelize)
      this.defaultStore = this.stores.sequelize
    }
    options.path && (this.path = options.path)
    this.httpService = new HttpService()
    this.modelPaths = {}
    this.models = {}
  }
  registerStores (stores) {
    if (stores.type && stores.options) {

    } else {
      for (let s in stores) {
      }
    }
  }
  define (modelName, attributes, options) {
    options = options || {}
    this.modelPaths[modelName] = options.path || getDefaultModelPath(modelName)
    const store = options.store || this.defaultStore
    switch (store) {
    }
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
 * @name get|put|post|patch|delete
 * @memberof module: sparrow-nest.prototype
 * @param { String } model name or path
 * @param { Function } callback route callback
 * @returns { Nest }
 */
HttpMethods.forEach(method => {
  Nest.prototype[method] = function (path, asyncProcedure) {
    const Model = this.models[path]
    path = resolve((this.path || '') + '/' + (Model ? Model.path : path))
    this.httpService[method](path, async (ctx, next) => {
      await asyncProcedure(ctx, next, Model)
    })
    if (Model && ['get', 'put', 'patch', 'delete'].indexOf(method) >= 0) {
      this.httpService[method](path + '/:id', async (ctx, next) => {
        await asyncProcedure(ctx, next, Model, ctx.params.id)
      })
    }
    return this
  }
})

Nest.DataTypes = DataTypes
Nest.StoreTypes = StoreTypes
Nest.TableNameMode = TableNameMode
Nest.FieldNameMode = FieldNameMode

module.exports = Nest
