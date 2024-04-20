import 'dotenv/config'
import { main } from './main'

const config = {
  id: '1446847653',

  // since_date: '2024-4-9',
  since_date: 12,
}

if (!process.env.cookie) {
  console.log({ cookie: process.env.cookie })
  process.exit(1)
}

main(config)
