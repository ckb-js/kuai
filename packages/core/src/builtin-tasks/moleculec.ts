import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { task } from '../config/config-env'
import { paramTypes } from '../params'

interface Args {
  schemaFile: string
  language: 'rust' | 'c' | 'ts'
  output?: string
}

const extMap: Record<Args['language'], string> = {
  rust: '.rs',
  c: '.cpp',
  ts: '.ts',
}

enum UInts {
  Uint8 = 1,
  Uint16 = 2,
  Uint32 = 4,
  Uint64 = 8,
  Uint128 = 16,
  Uint256 = 32,
  Uint512 = 64,
}

const basicMoleculeType = 'byte' as const

type SimpleMoleculeType = keyof typeof UInts

const tsBasicMolecuelType: SimpleMoleculeType = 'Uint8'

type MoleculeInterface =
  | SimpleMoleculeType
  | TableInterface
  | StructInterface
  | UinonInterface
  | VecInterface
  | ArrayInterface
  | OptionInterface

interface TableDeclare {
  type: 'table'
  fields: {
    name: string
    type: string
  }[]
}

interface TableInterface {
  type: 'table'
  value: Record<string, MoleculeInterface>
}

interface StructDeclare {
  type: 'struct'
  fields: {
    name: string
    type: string
  }[]
}

interface StructInterface {
  type: 'struct'
  value: Record<string, MoleculeInterface>
}

interface UinonDeclare {
  type: 'union'
  items: {
    typ: string
    id: number
  }[]
}

interface UinonInterface {
  type: 'union'
  value: Record<string, MoleculeInterface>
}

interface VecDeclare {
  type: 'fixvec' | 'dynvec'
  item: string
}

interface VecInterface {
  type: 'vec'
  value: MoleculeInterface
}

interface ArrayDeclare {
  type: 'array'
  item: string
  item_count: number
}

interface ArrayInterface {
  type: 'array'
  value: [MoleculeInterface, number]
}

interface OptionDeclare {
  type: 'option'
  item: string
}

interface OptionInterface {
  type: 'option'
  value: MoleculeInterface
}

type Declaration = (ArrayDeclare | StructDeclare | VecDeclare | TableDeclare | UinonDeclare | OptionDeclare) & {
  name: string
  imported_depth: number
}

interface Schema {
  namespace: string
  declarations: Declaration[]
}

function generateFixBytes(itemCount: number) {
  return (
    (UInts[itemCount] as SimpleMoleculeType) ??
    ({
      type: 'array',
      value: [tsBasicMolecuelType, itemCount],
    } as ArrayInterface)
  )
}

function generateSchemaToInterface(
  declaration: typeof basicMoleculeType | Declaration,
  declrationMap: Record<string, Declaration>,
): MoleculeInterface {
  if (typeof declaration === 'string') {
    if (declaration !== basicMoleculeType) throw new Error(`unknown simple type [${declaration}]`)
    return 'Uint8'
  }
  switch (declaration.type) {
    case 'array':
      if (declaration.item === basicMoleculeType) {
        return generateFixBytes(declaration.item_count)
      }
      if (!declrationMap[declaration.item]) throw new Error(`unknown schema type ${declaration.item}`)
      return {
        type: 'array',
        value: [generateSchemaToInterface(declrationMap[declaration.item], declrationMap), declaration.item_count],
      }
    case 'struct':
    case 'table':
      return {
        type: declaration.type,
        value: declaration.fields.reduce(
          (pre, v) => ({
            ...pre,
            [v.name]: generateSchemaToInterface(declrationMap[v.type] ?? v.type, declrationMap),
          }),
          {},
        ),
      }
    case 'fixvec':
    case 'dynvec':
    case 'option':
      return {
        type: declaration.type === 'option' ? 'option' : 'vec',
        value: generateSchemaToInterface(declrationMap[declaration.item] ?? declaration.item, declrationMap),
      }
    case 'union':
      return {
        type: 'union',
        value: declaration.items.reduce(
          (pre, v) => ({
            ...pre,
            [v.typ.toString()]: generateSchemaToInterface(declrationMap[v.typ] ?? v.typ, declrationMap),
          }),
          {},
        ),
      }
  }
}

function installMoleculec() {
  try {
    execSync('cargo install moleculec --locked', { stdio: 'inherit' })
  } catch (error) {
    console.error(`Error: install moleculec error with ${error instanceof Error ? error.message : ''}`)
  }
}

function checkMoleculecExist() {
  try {
    execSync('moleculec -help')
  } catch {
    console.warn('Warning: moleculec not found, start install moleculec')
    installMoleculec()
  }
}

export function generateTsInterface(schemaFile: string, outputPath: string) {
  const schemaStructJSON = execSync(`moleculec --schema-file ${schemaFile} --language - --format json`).toString()
  const { declarations } = JSON.parse(schemaStructJSON) as Schema
  const declarationsMaps: Record<string, Declaration> = {}
  declarations.forEach((v) => {
    declarationsMaps[v.name] = v
  })
  const outputStream = fs.createWriteStream(outputPath)
  declarations.map((v) => {
    outputStream.write(
      `export type ${v.name}Type = ${JSON.stringify(generateSchemaToInterface(v, declarationsMaps), undefined, 2)}`,
    )
    outputStream.write('\r\n')
    outputStream.write(
      `export const ${v.name}: ${v.name}Type = ${JSON.stringify(
        generateSchemaToInterface(v, declarationsMaps),
        undefined,
        2,
      )}`,
    )
    outputStream.write('\r\n\r\n')
  })
  outputStream.close()
}

task('moleculec', 'Create molecule interface with schema file')
  .addParam('schema-file', 'Provide a schema file to compile.', '', paramTypes.string)
  .addParam(
    'language',
    'Specify a language, then generate source code for the specified language and output the generated code',
    '',
    paramTypes.string,
  )
  .addParam(
    'output',
    "The generated code will output path, Default output to the schema-file's directory",
    '',
    paramTypes.string,
  )
  .addParam('install', 'install moleculec with cargo', false, paramTypes.boolean)
  .setAction(async ({ language, schemaFile, output }: Args) => {
    if (!language || !schemaFile) {
      console.error('Error: The following required arguments were not provided:')
      if (!language) console.error('--language <language>')
      if (!schemaFile) console.error('--schema-file <schema-file>')
      return
    }
    if (!fs.existsSync(schemaFile) || !fs.statSync(schemaFile).isFile()) {
      console.error(`Error: schema-file [${schemaFile}] should be a file`)
      return
    }
    if (language !== 'ts' && language !== 'rust' && language !== 'c') {
      console.error(`Error: language [${language}] should be one of ts/rust/c`)
      return
    }
    await checkMoleculecExist()
    console.info('start generate...')
    const outputPath =
      output ||
      path.format({
        dir: path.dirname(schemaFile),
        name: path.basename(schemaFile, '.mol'),
        ext: extMap[language],
      })
    try {
      if (language !== 'ts') {
        execSync(`moleculec --schema-file ${schemaFile} --language ${language} > ${outputPath}`, { stdio: 'inherit' })
      } else {
        generateTsInterface(schemaFile, outputPath)
      }
      console.info('generate success...')
    } catch (error) {
      console.error(
        `Error: ${
          error instanceof Error
            ? error.toString()
            : `moleculec --schema-file ${schemaFile} --language - --format json with unknown error`
        }`,
      )
    }
  })
