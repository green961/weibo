import { CheerioAPI } from 'cheerio'
import dayjs from 'dayjs'
import _ from 'lodash'
import path from 'path'
import { PageParser } from './page_parser.js'
import { download_one_file, handle_html } from './request.js'
import { download_weibo, write_weibo } from './txt_writer.js'
import { Config, UserConfig } from './types.js'
import { User } from './user.js'
import { mk, string_to_int } from './util.js'

export async function main(config: Config) {
  const id = config.id
  const date = config.since_date
  const since_date = typeof date === 'number' ? dayjs().subtract(date, 'day') : dayjs(date)

  let url = `https://weibo.cn/${id}/info`
  let $ = await handle_html(url)
  const user = extract_user_info($, id)

  url = `https://weibo.cn/${id}/profile`
  $ = await handle_html(url)
  let user_info = $('.tip2')
    .children()
    .map((index, element) => $(element).text())
    .get()
    .slice(0, 3)
    .map((e) => e.slice(3, e.length - 1))
  user.weibo_num = string_to_int(user_info[0])
  user.following = string_to_int(user_info[1])
  user.followers = string_to_int(user_info[2])
  let page_num = +$('input[name="mp"]').attr('value')

  $ = await handle_html(`https://weibo.cn/${id}/photo?tf=6_008`)
  url = 'https://weibo.cn' + $('img[alt="头像相册"]').parent().attr('href')
  $ = await handle_html(url)
  let pic_list = $('div.c img')
    .map((index, element) => $(element).attr('src'))
    .get()

  let avatarPath = `weibo/${user.nickname}/img/头像图片`
  await mk(avatarPath)
  await Promise.all(
    pic_list.map(async (url) => {
      let file_name = url.slice(url.lastIndexOf('/') + 1)
      let file_path = path.resolve(avatarPath, file_name)
      await download_one_file(url, file_path)
    })
  )

  let toContinue = true
  for (let page = 1; page <= page_num; page++) {
    if (toContinue) {
      let { weibos, weibo_id_list, to_continue } = await PageParser(
        { user_uri: id, since_date } as UserConfig,
        page
      )

      if (weibos.length) {
        await write_weibo(weibos, user)
        await download_weibo(weibos, user)
      } else {
        console.log('no data. weibos', weibos)
      }
      await new Promise((r) => setTimeout(r, 2000))
      toContinue = to_continue
    } else {
      break
    }
  }

  console.log('end')
}

function extract_user_info($: CheerioAPI, id: string) {
  try {
    let user = new User(id)

    let nickname = $('title').text()
    nickname = nickname.slice(0, nickname.length - 3)
    user.nickname = nickname

    let basic_info = $('.c')
      .eq(3)
      .contents()
      .map((i, e) => $(e).text())
      .get()
      .filter(Boolean)

    let zh_list = ['性别', '地区', '生日', '简介', '认证', '达人']
    let en_list = ['gender', 'location', 'birthday', 'description', 'verified_reason', 'talent']
    let zh_en = new Map(_.zip(zh_list, en_list))

    for (const i of basic_info) {
      let [_, key, value] = i.match(/(.*?):(.*)/)

      if (zh_en.has(key)) {
        user[zh_en.get(key)] = value.replaceAll('\u3000', '')
      }
    }

    let experienced = $('.tip').eq(2).text()
    if (experienced === '学习经历') {
      user.education = $('.c').eq(4).text().slice(1).replace(/\xa0/g, ' ')
      if ($('.tip').eq(3).text() === '工作经历') {
        user.work = $('.c').eq(5).text().slice(1).replace(/\xa0/g, ' ')
      }
    }
    return user
  } catch (error) {}
}

function _get_user_id($: CheerioAPI) {
  const urlList = $('.u a')
  for (const url of urlList) {
    if ($(url).text() == '资料') {
      const link = $(url).attr('href')
      if (link && link.endsWith('/info')) {
        return link.slice(1, link.length - 5)
      }
    }
  }
}
