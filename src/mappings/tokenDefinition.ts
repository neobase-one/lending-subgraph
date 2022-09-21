import { Address, BigInt } from '@graphprotocol/graph-ts'
import {
  ATOM_ADDRESS,
  CantoAtom_ADDRESS,
  CantoEth_Address,
  CantoNote_Address,
  ETH_ADDRESS,
  NoteUsdc_Address,
  NoteUsdt_Address,
  NOTE_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS,
  wCANTO_ADDRESS,
} from './consts'

// Initialize a Token Definition with the attributes
export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: i32

  // Initialize a Token Definition with its attributes
  constructor(address: Address, symbol: string, name: string, decimals: i32) {
    this.address = address
    this.symbol = symbol
    this.name = name
    this.decimals = decimals
  }

  // Get all tokens with a static defintion
  static getStaticDefinitions(): Array<TokenDefinition> {
    let staticDefinitions = new Array<TokenDefinition>(6)
    // Add Note
    let tokenNote = new TokenDefinition(
      Address.fromString(NOTE_ADDRESS),
      'NOTE',
      'NOTE',
      18,
    )
    staticDefinitions.push(tokenNote)

    // Add USDC
    let tokenUsdc = new TokenDefinition(
      Address.fromString(USDC_ADDRESS),
      'USDC',
      'USDC',
      6,
    )
    staticDefinitions.push(tokenUsdc)

    // Add USDT
    let tokenUsdt = new TokenDefinition(
      Address.fromString(USDT_ADDRESS),
      'USDT',
      'USDT',
      6,
    )
    staticDefinitions.push(tokenUsdt)

    // Add ATOM
    let tokenAtom = new TokenDefinition(
      Address.fromString(ATOM_ADDRESS),
      'ATOM',
      'ATOM',
      6,
    )
    staticDefinitions.push(tokenAtom)

    // Add ETH
    let tokenEth = new TokenDefinition(Address.fromString(ETH_ADDRESS), 'ETH', 'ETH', 18)
    staticDefinitions.push(tokenEth)

    // Add wCANTO
    let tokenWCanto = new TokenDefinition(
      Address.fromString(wCANTO_ADDRESS),
      'wCANTO',
      'wCANTO',
      18,
    )
    staticDefinitions.push(tokenWCanto)

    // Add vAMM-NOTE/WCANTO
    let tokenAmmCantoNote = new TokenDefinition(
      Address.fromString(CantoNote_Address),
      'vAMM-NOTE/WCANTO',
      'vAMM-NOTE/WCANTO',
      18,
    )
    staticDefinitions.push(tokenAmmCantoNote)

    // Add vAMM-ETH/WCANTO
    let tokenAmmCantoEth = new TokenDefinition(
      Address.fromString(CantoEth_Address),
      'vAMM-ETH/WCANTO',
      'vAMM-ETH/WCANTO',
      18,
    )
    staticDefinitions.push(tokenAmmCantoEth)

    // ADD vAMM-WCANTO/ATOM
    let tokenAmmCantoAtom = new TokenDefinition(
      Address.fromString(CantoAtom_ADDRESS),
      'vAMM-WCANTO/ATOM',
      'vAMM-WCANTO/ATOM',
      18,
    )
    staticDefinitions.push(tokenAmmCantoAtom)

    // ADD sAMM-NOTE/USDC
    let tokenAmmCantoUsdc = new TokenDefinition(
      Address.fromString(NoteUsdc_Address),
      'sAMM-NOTE/USDC',
      'sAMM-NOTE/USDC',
      18,
    )
    staticDefinitions.push(tokenAmmCantoUsdc)

    // ADD sAMM-NOTE/USDT
    let tokenAmmCantoUsdt = new TokenDefinition(
      Address.fromString(NoteUsdt_Address),
      'sAMM-NOTE/USDT',
      'sAMM-NOTE/USDT',
      18,
    )
    staticDefinitions.push(tokenAmmCantoUsdt)

    return staticDefinitions
  }

  // Helper for hardcoded tokens
  static fromAddress(tokenAddress: Address): TokenDefinition | null {
    let staticDefinitions = this.getStaticDefinitions()
    let tokenAddressHex = tokenAddress.toHexString()

    // Search the definition using the address
    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i]
      if (staticDefinition.address.toHexString() == tokenAddressHex) {
        return staticDefinition
      }
    }

    // If not found, return null
    return null
  }
}
