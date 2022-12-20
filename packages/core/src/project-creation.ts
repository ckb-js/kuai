import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { getRecommendedGitIgnore, getRecommendedPackageJson } from './project-structure'
import { getPackageRoot, getPackageJson } from './util/packageInfo'
import { prompt } from 'enquirer'
import { merge } from 'lodash'
import chalk from 'chalk'

function printAsciiLogo() {
  console.info(chalk.blue(`888    d8P                    d8b `))
  console.info(chalk.blue(`888   d8P                     Y8P `))
  console.info(chalk.blue(`888  d8P                          `))
  console.info(chalk.blue(`888d88K     888  888  8888b.  888 `))
  console.info(chalk.blue(`8888888b    888  888     "88b 888 `))
  console.info(chalk.blue(`888  Y88b   888  888 .d888888 888 `))
  console.info(chalk.blue(`888   Y88b  Y88b 888 888  888 888 `))
  console.info(chalk.blue(`888    Y88b  "Y88888 "Y888888 888 `))
  console.info('')
}

async function printWelcomeMessage() {
  const packageJson = await getPackageJson()

  console.info(chalk.cyan(`Welcome to kuai v${packageJson.version}\n`))
}

async function copySampleProject(projectRoot: string) {
  const packageRoot = getPackageRoot()

  fs.existsSync(projectRoot)

  const sampleProjectPath = path.join(packageRoot, 'sample-projects')

  const sampleProjectRootFiles = fs.readdirSync(sampleProjectPath)
  const existingFiles = sampleProjectRootFiles
    .map((f) => path.join(projectRoot, f))
    .filter((f) => fs.existsSync(f))
    .map((f) => path.relative(process.cwd(), f))

  if (existingFiles.length > 0) {
    const errorMsg = `We couldn't initialize the sample project because these files already exist: ${existingFiles.join(
      ', ',
    )}

Please delete or move them and try again.`
    console.error(errorMsg)
    process.exit(1)
  }

  fs.cpSync(path.join(packageRoot, 'sample-projects'), projectRoot, { recursive: true })
}

async function addGitIgnore(projectRoot: string) {
  const gitIgnorePath = path.join(projectRoot, '.gitignore')

  const content = await getRecommendedGitIgnore()

  if (fs.existsSync(gitIgnorePath)) {
    return fs.appendFileSync(gitIgnorePath, content)
  }

  fs.writeFileSync(gitIgnorePath, content)
}

async function createPackageJson(mergedPackageJson?: unknown) {
  const recommendProjectJson = await getRecommendedPackageJson()
  const mergedPackage = merge(recommendProjectJson, mergedPackageJson)

  fs.writeFileSync('package.json', JSON.stringify(mergedPackage, null, 2) + os.EOL)
}

export async function createProject(): Promise<void> {
  printAsciiLogo()

  await printWelcomeMessage()

  const { projectRoot } = await prompt<{ projectRoot: string }>({
    name: 'projectRoot',
    type: 'input',
    initial: process.cwd(),
    message: 'Kuai project root:',
  })

  const { shouldAddGitIgnore } = await prompt<{ shouldAddGitIgnore: boolean }>({
    name: 'shouldAddGitIgnore',
    type: 'confirm',
    initial: true,
    message: 'Do you want to add a .gitignore?',
  })

  const existedPackageJson = await (async () => {
    if (!fs.existsSync('package.json')) {
      return
    }

    // if has package, merge package.json with sample package.json
    const { shouldMergePackageJson } = await prompt<{ shouldMergePackageJson: boolean }>({
      name: 'shouldMergePackageJson',
      type: 'confirm',
      initial: false,
      message: 'Do you want merge sample package.json to existed package.json?',
    })

    if (shouldMergePackageJson) {
      try {
        return JSON.parse(fs.readFileSync('package.json', 'utf-8'))
      } catch (e) {
        console.error(`We couldn't initialize the sample project because package.json is not a valid JSON file.`)
        throw e
      }
    }
  })()

  await createPackageJson(existedPackageJson)

  if (shouldAddGitIgnore) {
    await addGitIgnore(projectRoot)
  }

  await copySampleProject(projectRoot)

  console.info(`✨ Project created ✨\n`)
  console.info('See the README.md file for some example tasks you can run\n')
}
