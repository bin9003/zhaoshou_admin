/**
 * 数据库
 * 
 */
const MongoClient = require('mongodb').MongoClient
const dbSet = require('./dbSet')

function _connectDB (callback) {
  let url = dbSet.dburl
  MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) {
      throw err
      db.close()
    }
    var dbo = db.db(dbSet.dbLibraryName)
    console.log('数据库连接成功！')
    callback(err, db, dbo)
  })
}

//查找数据，找到所有数据。 如果 有4个参数 时 args是个对象 如： {"pageamount":10,"page":10}
/**
 * collectionName 集合名称
 * json 查询条件
 * C 如果 三个参数 则为回调函数 如为四个参数 则为查询条数并跳过多少条数据 如：{"pageamount":10,"page":10} [pageamount] : 每页多少条，[page] : 查询多少条。
 * D 如果四个 则为回调函数
 */

exports.find = function (collectionName, json, C, D) {
  var result = []    //结果数组

  if (arguments.length == 3) {
    //那么参数C就是callback，参数D没有传。
    var callback = C
    var skipnumber = 0
    //数目限制
    var limit = 0
  } else if (arguments.length == 4) {
    var callback = D
    var args = C
    //应该省略的条数
    var skipnumber = args.pageamount * args.page || 0
    //数目限制
    var limit = args.pageamount || 0
    //排序方式
    var sort = args.sort || {}
  } else if (arguments.length <= 2 || arguments.length > 4) {
    throw new Error("find函数的参数个数，必须是3个，或者4个。")
    return
  }

  _connectDB(function (err, db, dbo) {
    var cursor = dbo.collection(collectionName).find(json).skip(skipnumber).limit(limit).sort(sort);
    cursor.each(function (err, doc) {
      if (err) {
        callback(err, null)
        db.close() //关闭数据库
        console.log('读取数据库数据错误')
        return;
      }
      if (doc != null) {
        result.push(doc)   //放入结果数组
      } else {
        //遍历结束，没有更多的文档了
        callback(null, result)
        db.close() //关闭数据库
      }
    });
  })
}

// 添加数据
exports.insertOne = (collecionName, json, callback) => {
  _connectDB((err, db, dbo) => {
    dbo.collection(collecionName).insertOne(json, (err, result) => {
      if (err) throw err
      console.log("文档插入成功")
      callback(err, result)
      db.close()
    })
  })
}

//删除
exports.deleteMany = function (collectionName, json, callback) {
  _connectDB(function (err, db, dbo) {
    dbo.collection(collectionName).deleteMany(
      json,
      function (err, results) {
        callback(err, results)
        db.close(); //关闭数据库
      }
    )
  })
}

//修改
exports.updateMany = function (collectionName, json1, json2, callback) {
  _connectDB(function (err, db, dbo) {
  if (err) throw err
  dbo.collection(collectionName).updateMany(
    json1,
    json2,
    function (err, results) {
      if (err) throw err
      callback(err, results)
      db.close()
    });
  })
}



// 获取集合所有数据
exports.getAllCount = function (collectionName,callback) {
  _connectDB(function (err, db, dbo) {
    dbo.collection(collectionName).count({}).then(function(count) {
      callback(count)
      db.close();
    });
  })
}