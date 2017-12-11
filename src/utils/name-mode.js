const TableNameMode = {
  UNDERLINE: 'UNDERLINE',
  TUNDERLINE: 'TUNDERLINE',
  CAMELCASE: 'CAMELCASE'
}

const FieldNameMode = {
  UNDERLINE: 'UNDERLINE',
  FUNDERLINE: 'FUNDERLINE',
  CAMELCASE: 'CAMELCASE'
}

function camelCase2Underline (name, mode) {
  let prefix = ''
  switch (mode) {
    case TableNameMode.TUNDERLINE:
      prefix = 't_'
      break
    case FieldNameMode.FUNDERLINE:
      prefix = 'f_'
      break
  }
  return prefix + name.replace(/([A-Z])/g, '_$1').toLowerCase()
}

module.exports = {
  TableNameMode,
  FieldNameMode,
  camelCase2Underline
}
