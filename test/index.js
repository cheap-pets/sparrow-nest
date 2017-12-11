const path = require('path')
const Nest = require('../src/index')
const FlakeId = require('flake-idgen')

const request = require('request-promise-native')

const Types = Nest.DataTypes
const flakeIdGen = new FlakeId()
const id2Int = require('biguint-format')

function idGen (count) {
  let ret
  if (count) {
    ret = []
    for (let i = 0; i < count; i++) {
      ret.push(id2Int(flakeIdGen.next(), 'dec'))
    }
  } else ret = id2Int(flakeIdGen.next(), 'dec')
  return ret
}

const myService = new Nest({
  path: 'tenant-service',
  tableNameMode: Nest.TableNameMode.UNDERLINE,
  fieldNameMode: Nest.FieldNameMode.UNDERLINE,
  sequelize: {
    dialect: 'sqlite',
    storage: path.resolve(__dirname, 'noname.db3'),
    pool: {
      max: 5,
      idle: 30000
    }
  }
})
/*
myService.sequelize
  .authenticate()
  .then(() => {
    console.log('Connection is ok.')
  })
  .catch(err => {
    console.error('Connection is bad.', err)
  })
*/
myService.defineModel(
  'tenant',
  {
    id: Types.ID,
    tenantName: Types.STRING,
    shortName: Types.STRING,
    memo: Types.STRING,
    isDisabled: Types.BOOLEAN,
    isRemoved: Types.BOOLEAN,
    createdAt: Types.DATE,
    updatedAt: Types.DATE
  },
  {
    idGenerator: idGen
  }
)

myService.listen(3000)

function testGet () {
  request('http://localhost:3000/tenant-service/tenants').then(data => {
    console.log('ok', data)
  }).catch(err => {
    console.error('bad', err)
  })
}

function testPost () {
  request({
    method: 'POST',
    url: 'http://localhost:3000/tenant-service/tenants',
    form: {
      tenantName: 'xx',
      shortName: 'x'
    }
  }).then(data => {
    console.log('ok', data)
  }).catch(err => {
    console.error('bad', err)
  })
}

testGet()
testPost()
