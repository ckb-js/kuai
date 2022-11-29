import { startApp } from './app'

startApp()
  .then(() => console.log(`App finished running successfully.`))
  .catch((error) => {
    console.error(`Ohh noo! Error while running the app!`)
    console.error(error)
  })
