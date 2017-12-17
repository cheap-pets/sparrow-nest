const Sequelize = require('sequelize')

const defineModel = require('./define-model')
const defineMethods = require('./define-methods')

function getSequelizeInstance (v) {
  return v instanceof Sequelize ? v : new Sequelize(v)
}

class SequelizeStore {
  constructor (nest, options) {
    this.nest = nest
    this.sequelize = getSequelizeInstance(options)
  }
  define (modelName, attributes, options) {
    const Model = defineModel.call(this, modelName, attributes, options)
    Model.path = options.path || defineMethods(modelName)
    Model.idGenerator = options.idGenerator
    if (options.methods !== false) defineMethods(this.nest, modelName, options.methods)
    return Model
  }
}

module.exports = SequelizeStore
