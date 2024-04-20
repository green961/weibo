import axios from 'axios'
import axiosRetry from 'axios-retry'

const instance = axios.create()

axiosRetry(instance, { retries: 3 })

const imageUrl = 'http://upload.hxnews.com/2024/0418/1713423178563.jpg'
const localFilePath = 'image_fuckPussy.jpg'

// async function fuck() {
//   console.log('fuck 1')
//   let ee = await instance({
//     method: 'get',
//     timeout:10,
//     url: imageUrl,
//     responseType: 'stream', // 设置响应数据类型为流
//   })

//   console.log('fuck 2')
//   ee.data.pipe(fs.createWriteStream(localFilePath))
//   console.log('fuck end')
// }
console.time()

async function fuck() {
  console.log('fuck 1')
  await new Promise((r) => setTimeout(r, 1000))
  console.log('fuck end')
}
;(async function () {
  await Promise.all(
    [1, 2, 3].map(async () => {
      await fuck()
    })
  )
  // for (const _ of [1, 2, 3]) {
  //   await fuck()
  // }
  console.log('end')
  console.timeEnd()
})()
