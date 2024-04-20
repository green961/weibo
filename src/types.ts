import type { Dayjs } from 'dayjs'

export type Config = {
  id: string
  // since_date: Dayjs | number
  since_date: string | number
}

export type UserConfig = {
  user_uri: string
  since_date: Dayjs
  end_date: string
}

export type PageParser = UserConfig & {
  // cookie: string
  url: string
}

export type Weibo = {
  id: string

  weibo_content: string
  original_pictures: string

  publish_place: string
  publish_time: string
  publish_tool: string

  up_num: number
  retweet_num: number
  comment_num: number
}
