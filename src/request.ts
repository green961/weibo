import axios, { AxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'
import cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { Weibo } from './types'
import { User } from './user'
import { mk, randInt, sleep } from './util'

export const requests = axios.create({
  headers: {
    Cookie: process.env.cookie,
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  },
})

export async function handle_download(urls: string, w: Weibo, user: User) {
  let file_prefix = w.publish_time.slice(0, 10).replaceAll('-', '') + '_' + w.id
  let file_dir = `weibo/${user.nickname}/img/原创微博图片`
  await mk(file_dir)

  try {
    if (urls.includes(',')) {
      let url_list = urls.split(',')
      await Promise.all(
        url_list.map(async (url, i) => {
          let file_suffix = path.extname(url)
          let file_name = `${file_prefix}_${i + 1}${file_suffix}`
          let file_path = path.resolve(file_dir, file_name)
          await download_one_file(url, file_path)
        })
      )
    }
  } catch (error) {
    console.log(error)
    console.log(urls)
  }
}

export async function handle_html(url: string, wait = true) {
  if (wait) {
    await sleep(randInt())
  }
  const resp = await requests.get(url)
  const $ = cheerio.load(resp.data)
  return $
}

export async function getRetry(config: AxiosRequestConfig) {
  await sleep(randInt())
  const instance = axios.create()

  axiosRetry(instance, { retries: 5 })

  return await instance(config)
}

export async function download_one_file(url: string, file_path: string, weibo_id = 'xxx') {
  let ee = await getRetry({
    method: 'get',
    url: url,
    timeout: 5000,
    responseType: 'stream', // 设置响应数据类型为流
  })

  ee.data.pipe(fs.createWriteStream(file_path))
}
