import type { Cheerio, CheerioAPI, Element } from 'cheerio'
import dayjs from 'dayjs'
import { handle_html } from './request'
// import { CheerioRoot, PageParser, UserConfig, Weibo } from './types'
import { PageParser, UserConfig, Weibo } from './types'

export async function PageParser(
  user_config: UserConfig,
  page: number,
  weibo_id_list: string[] = [],
  to_continue = true
) {
  const { user_uri, since_date, end_date } = user_config
  let url = `https://weibo.cn/${user_uri}/profile?page=${page}`

  const pageParser: PageParser = {
    user_uri,
    since_date,
    end_date,
    url,
  }

  const weibos: Weibo[] = []
  let $ = await handle_html(pageParser.url)
  let infos = $('div.c')
  infos = infos.slice(1, infos.length - 1)

  for (let i = 0; i < infos.length; i++) {
    let weibo = await get_one_weibo($, infos[i])
    if (!weibo) {
      continue
    }

    const publish_time = dayjs(weibo.publish_time)
    if (publish_time.isBefore(since_date)) {
      if (page === 1 && (i === 0 || i === 1)) {
        continue
      } else {
        to_continue = false
        break
      }
    }

    weibos.push(weibo)
    weibo_id_list.push(weibo.id)
  }

  return { weibos, weibo_id_list, to_continue }
}

function is_original(infoSelector: Cheerio<Element>) {
  if (infoSelector.find('div span.cmt').length > 3) {
    return false
  }
  return true
}

async function get_one_weibo($: CheerioAPI, info: Element): Promise<Weibo> {
  const infoS = $(info)
  let isOriginal = is_original(infoS)

  if (!isOriginal) {
    return
  }

  let id = infoS.attr('id').slice(2)

  let text = handle_garbled(infoS)
  let weibo_content = text.slice(0, text.lastIndexOf('赞'))

  let [a_text, a_list]: [string[], string[]] = infoS
    .find('div a')
    .map((_, element) => [[$(element).text(), $(element).attr('href')]])
    .get()
    .reduce(
      ([textAcc, listAcc], [zh, en]) => {
        textAcc.push(zh)
        listAcc.push(en)
        return [textAcc, listAcc]
      },
      [[], []]
    )

  let first_pic = 'https://weibo.cn/mblog/pic/' + id
  let all_pic = 'https://weibo.cn/mblog/picAll/' + id

  let original_pictures = ''
  if (a_list.some((e) => e.includes(first_pic))) {
    if (a_list.some((e) => e.includes(all_pic))) {
      const url = `https://weibo.cn/mblog/picAll/${id}?rl=1`
      const $ = await handle_html(url, false)
      const picture_list = $('img')
        .map((index, element) => $(element).attr('src'))
        .get()
        .map((p) => p.replace('/thumb180/', '/large/'))

      original_pictures = picture_list.join(',')
    } else {
      let i = 0
      for (; i < a_list.length; i++) {
        if (a_list[i].includes(first_pic)) {
          break
        }
      }

      original_pictures = $(infoS[i])
        .find('img')
        .map((_, e) => $(e).attr('src'))
        .get()[0]
        .replace('/wap180/', '/large/')
    }
  }

  if (a_text.includes('全文')) {
    let url = `https://weibo.cn/comment/${id}`
    let $ = await handle_html(url)
    let info = $('div.c').eq(1)
    let wb_content = handle_garbled(info)

    let wb_time = info.find('span.ct').text()
    const start = wb_content.indexOf(':') + 1
    const end = wb_content.lastIndexOf(wb_time)
    weibo_content = wb_content.substring(start, end).trim()
  }

  let video_page_url =
    infoS
      .find('div:nth-child(1) a')
      .map((_, e) => $(e).attr('href'))
      .get()
      .find((e) => e.includes('m.weibo.cn/s/video/show?object_id=')) || ''

  a_text = infoS
    .find('div')
    .eq(0)
    .find('a')
    .map((_, e) => $(e).text())
    .get()
  let publish_place = '无'
  const index = a_text.findIndex((e) => e === '显示地图')
  if (index !== -1) {
    publish_place = a_text[index - 1]
  }

  let publish = handle_garbled(infoS.find('div span.ct').eq(0))
  let [publish_time, publish_tool] = publish.split('来自')
  if (publish_time.includes('月')) {
    const year = dayjs().format('YYYY')
    const month = publish_time.slice(0, 2)
    const day = publish_time.slice(3, 5)
    const time = publish_time.slice(7, 12)
    publish_time = `${year}-${month}-${day} ${time}`
  } else {
    publish_time = publish.slice(0, 16)
  }

  let str_footer = handle_garbled(infoS.find('div').last())
  str_footer = str_footer.slice(str_footer.lastIndexOf('赞'))

  let [up_num, retweet_num, comment_num] = [0, 0, 0]
  try {
    let pattern = /\d+/gm
    let weibo_footer = [...str_footer.matchAll(pattern)].flatMap((e) => +e)
    ;[up_num, retweet_num, comment_num] = weibo_footer
  } catch (error) {
    console.log(error)
  }

  return {
    id,
    weibo_content,
    original_pictures,
    publish_place,
    publish_time,
    publish_tool,
    up_num,
    retweet_num,
    comment_num,
  }
}

function handle_garbled(info: Cheerio<Element>): string {
  return info.text().replaceAll('\u200b', '').replaceAll('\xa0', ' ')
}

function get_weibo_content(aa: Weibo) {
  let weibo_id = aa.id
}
