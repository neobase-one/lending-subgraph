import { BigDecimal } from '@graphprotocol/graph-ts'
import { exponentToBigDecimal } from './helpers'

/*
--- ERC20 Addresses
*/
export const NOTE_ADDRESS = '0x4e71a2e537b7f9d9413d3991d37958c0b5e1e503'
export const ATOM_ADDRESS = '0xeceeefcee421d8062ef8d6b4d814efe4dc898265'
export const ETH_ADDRESS = '0x5fd55a1b9fc24967c4db09c513c3ba0dfa7ff687'
export const USDC_ADDRESS = '0x80b5a32e4f032b2a058b4f29ec95eefeeb87adcd'
export const USDT_ADDRESS = '0xd567b3d7b8fe3c79a1ad8da978812cfc4fa05e75'
export const CantoNote_Address = '0x1d20635535307208919f0b67c3b2065965a85aa9'
export const CantoEth_Address = '0x216400ba362d8fce640085755e47075109718c8b'
export const CantoAtom_ADDRESS = '0x30838619c55b787bafc3a4cd9aea851c1cfb7b19'
export const NoteUsdc_Address = '0x9571997a66d63958e1b3de9647c22bd6b9e7228c'
export const NoteUsdt_Address = '0x35db1f3a6a6f07f82c76fcc415db6cfb1a7df833'

/*
--- cToken Addresses
*/
export const cUSDT_ADDRESS = '0x6b46ba92d7e94ffa658698764f5b8dfd537315a9'
export const cUSDC_ADDRESS = '0xde59f060d7ee2b612e7360e6c1b97c4d8289ca2e'
export const cETH_ADDRESS = '0x830b9849e7d79b92408a86a557e7baaacbec6030'
export const cNOTE_ADDRESS = '0xee602429ef7ece0a13e4ffe8dbc16e101049504c'
export const cCANTO_ADDRESS = '0xb65ec550ff356eca6150f733ba9b954b2e0ca488'
export const cATOM_ADDRESS = '0x617383f201076e7ce0f6e625d1a983b3d1bd277a'
export const cCantoNote_ADDRESS = '0x3c96dcfd875253a37acb3d2b102b6f328349b16b'
export const cCantoEth_ADDRESS = '0xb49a395b39a0b410675406bee7bd06330cb503e3'
export const cCantoAtom_ADDRESS = '0xc0d6574b2fe71eed8cd305df0da2323237322557'
export const cNoteUsdc_Address = '0xd6a97e43fc885a83e97d599796458a331e580800'
export const cNoteUsdt_Address = '0xf0cd6b5ce8a01d1b81f1d8b76643866c5816b49f'

// export const cW_CANTO_ADDRESS = "0x5e23dc409fc2f832f83cec191e245a191a4bcc5c";
export const wCANTO_ADDRESS = '0x826551890Dc65655a0Aceca109aB11AbDbD7a07B'
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export const BaseV1Router_Address = '0x8fa61F21Fb514d2914a48B29810900Da876E295b'

export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let HUNDRED_BD = BigDecimal.fromString('100')
export let NegOne_BD = BigDecimal.fromString('-1')

export const MANTISSA_FACTOR = 18
export let MANTISSA_FACTOR_BD = exponentToBigDecimal(MANTISSA_FACTOR)

export const cTOKEN_DECIMALS = 18
export let cTOKEN_DECIMALS_BD = exponentToBigDecimal(cTOKEN_DECIMALS)

export const BLOCK_TIME = 5.8
export let BLOCK_TIME_BD = BigDecimal.fromString(BLOCK_TIME.toString())

export const SECONDS_IN_DAY = 24 * 60 * 60
export let SECONDS_IN_DAY_BD = BigDecimal.fromString(SECONDS_IN_DAY.toString())

export const DAYS_IN_YEAR = 365
export let DAYS_IN_YEAR_BD = BigDecimal.fromString(DAYS_IN_YEAR.toString())
