var msDB = require('../model/MysqlDB')

let sqlVul = {
  'name': 'abcd',
  'sex': '男',
  'ages': '34',
  'content': 'mkslfjkslfjsl11',
  'aa' : '111'
}

// msDB.add('student', sqlVul, function (err, result) {
//   // result.affectedRows 返回 false 时 表明不存在
//   console.log(err, result)
// })

// msDB.sqlQuery('show tables like "students"', function (err, data) {
//   console.log(data[0] === undefined) 
// })
// msDB.sqlTableJudgeNull('student', function (data) {
//   console.log(data)
// })

msDB.alter('student', {name: 'huahua', ages: 22, sex: 'nv'}, [['name', 'aa'], 'and', ['sex', '男'], 'or', ['content', '说明介绍了11']], function (err, res) {
  console(err, res)
})