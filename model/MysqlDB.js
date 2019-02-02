var mysql      = require('mysql');
var msSet = require('./mysqlSet')
var mysqlDb = {}
// 连接数据库
function connect (collback) {
  var connection = mysql.createConnection(msSet.mysqlBase);
  connection.connect(function (err, data) {
    collback(connection)
  });
}

/**
 * 数据库操作
 * @param {*} sql  sql语句
 * @param {*} B 
 * @param {*} C 
 */
function sqlQuery (sql, B, C) {
  var sqlV, collback
  if (arguments.length == 2) {
    collback = B
  } else if (arguments.length == 3) {
    sqlV = B
    collback = C
  } else if (arguments.length < 2 || arguments.length > 3) {
    console.log('参数个数为两个或三个！')
    return
  }
  
  connect((connection) => {
    connection.query(sql, sqlV, function (err, result) {
      if (err) throw err
      
      collback(err, result)
    })
    connection.end()
  })
}

/**
 * 判断 字段是否存在
 * @param {*} tableName 表名
 * @param {*} columnName 字段名
 * @param {*} collback 回调
 */
function sqlJudgeColumnName (tableName, columnName, collback) {
  let sql = 'select count(*) from information_schema.columns where table_name="'+ tableName +'" and column_name = '+ columnName +'"'
  sqlQuery(sql, (err, res) => {
    collback(err, res)
  })
}



/**
 * 判断 表名是否存在
 * @param {*} tableName 
 * @param {*} collback 
 */
function sqlTableJudgeNull(tableName, collback) {
  let sql = 'show tables like "'+ tableName +'"'
  sqlQuery(sql, function (err, result) {
    if (collback) {
      if (result[0]) {
        collback(err, true)
      } else {
        collback(err, false)
      }
    }
  })
}

/**
 * sql 添加数据 时 数据 拼接
 * @param {*} obj 对象 或 json对象
 * 遍历 obj 每个key 和 value 并把 key 的值全部拼接 value 的值也全部进行 拼接
 * @returns [*] 返回 拼接后的数组
 */
function objFallToString (obj) {
  let V = '', // value 拼接后接收变量
  K = '' // key 拼接后接收变量
  // 循环表值并进行拼接
  for (let key in obj) {
    K = K.concat( key, ',' )
    V = V.concat( '"', obj[key], '"', ',' )
  }
  // 删除最后一个逗号
  K = K.substring(0, K.length - 1)
  V = V.substring(0, V.length - 1)
  
  return [K, V]
}

/** ↑
 * 插入数据
 * tableName 表名称
 * tableObj 对象或者 json 对象 key 为 表头 value 为 表值 { 表头名: '值'} 或 { '表头名称': '值' }
 * collback 回调函数
 * 
 */
Db.add = (tableName, tableObj, collback) => {
  //
  sqlTableJudgeNull(tableName, (err, data) => {
    if (!data) {
      collback(err, false)
      return
    }
    let KVArr = objFallToString(tableObj)
    // 拼接 sql 语句
    let sql = "insert into "+ tableName +" ("+ KVArr[0] +") value ("+ KVArr[1] +")"
    sqlQuery(sql, collback)
  })
}

/**
 * sql 语句 更改数据 中的替换数据拼接
 * 如果 遇到了 key 为 directConcat 时, 
 *    1. 直接拼接这个key 中的值
 *    2. 不在这个key 这个后面添加逗号
 *    3. 删除它前面的逗号
 * @param {*} val 
 */
function alterDataConcat (val) {
  // name='花花',age=21
  let v = ''
  for (let k in val) {
    if (k === 'directConcat') {
      v = v.substring(0, v.length - 1)
      v = v.concat(' ', val[k], ' ')
    } else {
      v = v.concat(k, '=', '"', val[k], '"', ',')
    }
  }
  v = v.substring(0, v.length - 1)
  return v
}

/**
 * sql 语句中 where 部分 语句拼接
 * @param [[key, value], sign, [key, sign, value]] val 
 *    [key, value] 如果两个值 默认 中间拼接为 '='
 */
function selectCondition (val) {
  let c = ''
  for (let v of val) {
    if (Array.isArray(v)) {
      if (v.length == 2) {
        c = c.concat(v[0], '=','"', v[1], '"')
      } else {
        c = c.concat(v[0], v[1], '"', v[2], '"')
      }
      
    } else if(typeof v == 'string') {
      c = c.concat(' ', v, ' ')
    } else {
      return ''
    }
  }
  return c
}
/**
 * 更改数据
 * 如 ： update tableName set name='花花',age=21,sex='女' where id=2
 * tableName  表名           相当于 tableName
 * tableValue 要修改值      相当于 name='花花',age=21,sex='女'
 * queryCondition  修改条件      相当于 id=2
 * collback   回调函数
 */
Db.alter = (tableName, tableValue, queryCondition, collback) => {
  let sql = 'update ' + tableName + ' set '+ alterDataConcat(tableValue) +' where ' + selectCondition(queryCondition)
  sqlQuery(sql, collback)
}


/**
 * 删除数据
 * @param tableName  表名               相当于 tableName
 * @param queryCondition  修改条件      相当于 id=2
 * @param collback   回调函数
 */
Db.delete = function (tableName, queryCondition, collback) {
  // delete from student where id=5;
  let sql = 'delete from '.concat(tableName, ' where ', selectCondition(queryCondition))
  console.log(sql)
  sqlQuery(sql, function (err, res) {
    collback(err, res)
  })
}

/**
 * 如：select id,name from student where date>'1988-1-2' and date<'1988-12-1';
 * @param {string} tableName  表名         相当于 tableName
 * @param {Array} findColumnsNames        相当于 id,name
 * @param {Array} queryCondition  修改条件        相当于 date>'1988-1-2' and date<'1988-12-1';
 * @param {Function} collback   回调函数
 */
Db.find = function (tableName, findColumnsNames, queryCondition, collback) {
  let sql = 'select '.concat(findColumnsNames, ' from ', tableName), // sql 语句默认值
  C
  if (arguments.length == 3) {
    collback = queryCondition
  } else if (arguments.length > 4 || arguments.length < 3) {
    collback('参数个数不对！', null)
  }
  if ( Array.isArray( queryCondition ) && queryCondition.length > 1 ) {
    if ( queryCondition[0].trim() == 'limit' ) {
      sql = 'select '.concat(findColumnsNames, ' from ', tableName, selectCondition(queryCondition))
    }else {
      sql = 'select '.concat(findColumnsNames, ' from ', tableName,' where ', selectCondition(queryCondition))
    }
    
  }
  // console.log(sql)
  sqlQuery(sql, function (err, res) {
    collback(err, res)
  })
}

module.exports.Db = Db
exports.sqlQuery = sqlQuery
exports.sqlTableJudgeNull = sqlTableJudgeNull
exports.sqlJudgeColumnName = sqlJudgeColumnName