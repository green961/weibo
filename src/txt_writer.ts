import fsp from 'fs/promises'
import path from 'path'
import { handle_download } from './request'
import { Weibo } from './types'
import { User } from './user'
import { mk } from './util'

const kvMap = new Map([
  ['publish_place', '微博位置'],
  ['publish_time', '发布时间'],
  ['up_num', '点赞数'],
  ['retweet_num', '转发数'],
  ['comment_num', '评论数'],
  ['publish_tool', '发布工具'],
])

export async function download_weibo(weibos: Weibo[], user: User) {
  for (const weibo of weibos) {
    const { original_pictures } = weibo
    if (original_pictures) {
      await handle_download(original_pictures, weibo, user)
    }
  }
}

export async function write_weibo(weibos: Weibo[], user: User) {
  let temp_result = weibos.map((weibo) => {
    let arr = []
    for (const [k, v] of kvMap) {
      arr.push(`${kvMap.get(k)}：${weibo[k] || '无'}`)
    }

    return `${weibo.weibo_content}\n${arr.join('\n')}`
  })

  const dir = `weibo/${user.nickname}`
  await mk(dir)

  const result = `${temp_result.join('\n\n')}\n\n`
  const file_path = path.resolve(dir, `${user.id}.txt`)
  await fsp.appendFile(file_path, result)

  // console.log()
}
