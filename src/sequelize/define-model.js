const Types = require('../utils/data-types')
const TypeMapping = require('./type-mapping')
const {
  TableNameMode,
  FieldNameMode,
  camelCase2Underline
} = require('../utils/name-mode')

function convert2SequelizeType (localType) {
  return TypeMapping[localType].Sequelize
}

function defineModel (sequelize, name, attributes, options) {
  const tableNameMode = options.tableNameMode || TableNameMode.CAMELCASE
  const fieldNameMode = options.fieldNameMode || FieldNameMode.CAMELCASE

  const defineOptions = Object.assign(
    {
      freezeTableName: true,
      tableName: tableNameMode === TableNameMode.CAMELCASE
        ? name
        : camelCase2Underline(name, tableNameMode),
      createdAt: false,
      updatedAt: false,
      deletedAt: false
    },
    options.sequelizeDefineOptions
  )

  const attributesOptions = {}
  let primaryKeyAttribute
  Object.keys(attributes).forEach(attr => {
    const v = attributes[attr]
    const attrOptions = typeof v === 'string' ? { type: v } : v

    // field name
    !attrOptions.field &&
      fieldNameMode !== FieldNameMode.CAMELCASE &&
      (attrOptions.field = camelCase2Underline(attr, fieldNameMode))
    // primary key
    if (
      attr === 'id' ||
      attrOptions.type === Types.ID ||
      attrOptions.type === Types.STRID
    ) {
      attrOptions.primaryKey = true
      primaryKeyAttribute = attr
    }
    // field type
    attrOptions.rawType = attrOptions.type
    typeof attrOptions.type === 'string' &&
      (attrOptions.type = convert2SequelizeType(attrOptions.type))

    // createdAt && updatedAt
    if (attr === 'createdAt' || attrOptions.createdAt) {
      defineOptions.createdAt = attrOptions.field
    } else if (attr === 'updatedAt' || attrOptions.updatedAt) {
      defineOptions.updatedAt = attrOptions.field
    }

    attributesOptions[attr] = attrOptions
  })

  const Model = sequelize.define(name, attributesOptions, defineOptions)
  Model.modelName = name
  Model.primaryKeyAttribute = primaryKeyAttribute
  Model.attributesOptions = attributesOptions
  return Model
}

module.exports = defineModel
