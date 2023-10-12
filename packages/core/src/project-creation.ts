import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { spawn } from 'node:child_process'
import { getRecommendedGitIgnore, getRecommendedPackageJson } from './project-structure'
import { getPackageRoot, getPackageJson } from './util/packageInfo'
import { prompt } from 'enquirer'
import { merge } from 'lodash'
import chalk from 'chalk'

interface Dependencies {
  [name: string]: string
}

interface NpmLink {
  name: string
  version: string
  path: string
}

const DEPENDENCIES: Dependencies = {
  koa: '2.14.1',
  'koa-body': '6.0.1',
}

const DEV_DEPENDENCIES: Dependencies = {
  jest: '29.7.0',
  'ts-node': '10.9.1',
  typescript: '4.9.4',
  typedoc: '0.24.7',
}

async function getKuaiVersion(): Promise<string> {
  const packageJson = await getPackageJson()
  return packageJson.version
}

async function getKuaiDepdencies(): Promise<Dependencies> {
  const version = await getKuaiVersion()
  return {
    '@ckb-js/kuai-core': version,
    '@ckb-js/kuai-io': version,
    '@ckb-js/kuai-models': version,
  }
}

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

async function canInstallRecommendedDeps(packageJsonPath: string) {
  return (
    fs.existsSync(packageJsonPath) &&
    // TODO: Figure out why this doesn't work on Win
    // cf. https://github.com/nomiclabs/hardhat/issues/1698
    os.type() !== 'Windows_NT'
  )
}

async function installRecommendedDependencies(projectRoot: string, dependencies: Dependencies, dev = false) {
  console.log('')

  const deps = Object.entries(dependencies).map(([name, version]) => `${name}@${version}`)

  // The reason we don't quote the dependencies here is because they are going
  // to be used in child_process.sapwn, which doesn't require escaping string,
  // and can actually fail if you do.
  return runCommand('npm', ['install', dev ? '--save-dev' : '--save', '-E', ...deps], projectRoot)
}

async function getNpmLinksText(): Promise<string> {
  const childProcess = spawn('npm', ['ls', '--link', '--global'])

  return new Promise((resolve, reject) => {
    let output = ''

    childProcess.stdout?.setEncoding('utf8')
    childProcess.stdout?.on('data', function (data) {
      console.log('stdout: ' + data)

      data = data.toString()
      output += data
    })

    childProcess.once('close', (status) => {
      childProcess.removeAllListeners('error')

      if (status === 0) {
        resolve(output)
        return
      }

      reject(false)
    })

    childProcess.once('error', (_status) => {
      childProcess.removeAllListeners('close')
      reject(false)
    })
  })
}

async function getNpmLinks(): Promise<Array<NpmLink>> {
  const res = await getNpmLinksText()

  const links: NpmLink[] = []
  res.split(/\r?\n/).forEach((line) => {
    const res = /.*?─ (.*)@(.*) -> (.*)/g.exec(line)
    if (res && res[1]) {
      links.push({
        name: res[1],
        version: res[2],
        path: res[3],
      })
    }
  })

  return links
}

async function checkLocalKuaiLink() {
  const links = await getNpmLinks()

  const kuaiDep = await getKuaiDepdencies()

  return Object.keys(kuaiDep).every((kuaiDep) => links.findIndex((link) => link.name === kuaiDep) !== -1)
}

async function installKuaiDependencies(projectRoot: string) {
  const kuaiDep = await getKuaiDepdencies()

  if (await checkLocalKuaiLink()) {
    const { shouldUseLocalKuaiPackages } = await prompt<{ shouldUseLocalKuaiPackages: boolean }>({
      name: 'shouldUseLocalKuaiPackages',
      type: 'confirm',
      initial: true,
      message: 'Do you want to use local kuai package by npm link?',
    })

    if (shouldUseLocalKuaiPackages) {
      await runCommand('npm', ['link', ...Object.keys(kuaiDep)], projectRoot)
      console.info(`✨ Link local kuai package successed ✨\n`)
    }
  }

  console.info('add kuai dependencies into package')
  return installRecommendedDependencies(projectRoot, kuaiDep, false)
}

async function runCommand(command: string, args: string[], projectRoot?: string): Promise<boolean> {
  const childProcess = spawn(command, args, {
    stdio: 'inherit',
    cwd: projectRoot,
  })

  return new Promise((resolve, reject) => {
    childProcess.once('close', (status) => {
      childProcess.removeAllListeners('error')

      if (status === 0) {
        resolve(true)
        return
      }

      reject(false)
    })

    childProcess.once('error', (_status) => {
      childProcess.removeAllListeners('close')
      reject(false)
    })
  })
}

async function createPackageJson(packageJsonPath: string, mergedPackageJson?: unknown) {
  const recommendProjectJson = await getRecommendedPackageJson()
  const mergedPackage = merge(recommendProjectJson, mergedPackageJson)

  fs.writeFileSync(packageJsonPath, JSON.stringify(mergedPackage, null, 2) + os.EOL)
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

  const { shouldBuildDoc } = await prompt<{ shouldBuildDoc: boolean }>({
    name: 'shouldBuildDoc',
    type: 'confirm',
    initial: true,
    message: 'Do you want to build doc after create project?',
  })

  if (!fs.existsSync(projectRoot)) {
    fs.mkdirSync(projectRoot, { recursive: true })
  }

  const packageJsonPath = path.join(projectRoot, 'package.json')

  const existedPackageJson = await (async () => {
    if (!fs.existsSync(packageJsonPath)) {
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
        return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      } catch (e) {
        console.error(`We couldn't initialize the sample project because package.json is not a valid JSON file.`)
        throw e
      }
    }
  })()

  await createPackageJson(packageJsonPath, existedPackageJson)

  if (shouldAddGitIgnore) {
    await addGitIgnore(projectRoot)
  }

  await copySampleProject(projectRoot)

  if (await canInstallRecommendedDeps(packageJsonPath)) {
    await installKuaiDependencies(projectRoot)
    await installRecommendedDependencies(projectRoot, DEPENDENCIES, false)
    await installRecommendedDependencies(projectRoot, DEV_DEPENDENCIES, true)
  }

  if (shouldBuildDoc) {
    await runCommand('npm', ['run', 'doc'], projectRoot)
    console.info(`✨ doc build success, you can see it at ./docs ✨\n`)
  }

  console.info(`✨ Project created ✨\n`)
  console.info('See the README.md file for some example tasks you can run\n')
}
