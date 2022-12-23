import { ok } from 'assert'
import { container, TypeOrmManager } from '../../../src'
import { UserService, PostService, CategoryService } from './services'
import { User, Post, Category } from './entities'

export async function startApp(): Promise<void> {
  await TypeOrmManager.importRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'test',
    password: 'test',
    database: 'test',
    synchronize: true,
    logging: false,
    entities: [User, Post, Category],
    migrations: [],
    subscribers: [],
  })
  await TypeOrmManager.importRepository([User, Post, Category])

  const category1 = new Category()
  category1.name = 'TypeScript'

  const category2 = new Category()
  category2.name = 'Programming'

  const categoryService = container.get<CategoryService>(CategoryService.name)
  categoryService.saveByRepository(category1)
  categoryService.saveByRepository(category2)

  const post = new Post()
  post.title = 'TypeScript'
  post.content = `TypeScript is Awesome!`
  post.categories = [category1, category2]

  const postService = container.get<PostService>(PostService.name)
  postService.saveByManager(post)

  const user = new User()
  user.name = `Alice`
  user.posts = [post]

  const userService = container.get<UserService>(UserService.name)

  await userService.saveByManager(user)

  /** Load the saved users so we can assert on them. */
  const userList = await userService.findAll()
  console.log({ userList })

  for (const user of userList) {
    ok(user instanceof User)
  }

  /** Load the saved posts so we can assert on them. */
  const postList = await postService.findAll()
  console.log(postList)

  for (const post of postList) {
    ok(post instanceof Post)
  }

  /** Load the saved posts so we can assert on them. */
  const categoryList = await categoryService.findAll()
  console.log(categoryList)

  for (const category of categoryList) {
    ok(category instanceof Category)
  }

  await TypeOrmManager.destroyDataSource()
}
