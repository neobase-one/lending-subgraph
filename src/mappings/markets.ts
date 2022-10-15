/* eslint-disable prefer-const */ // to satisfy AS compiler

// For each division by 10, add one to exponent to truncate one significant figure
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts/index'
import { Market, Comptroller } from '../types/schema'
// PriceOracle is valid from Comptroller deployment until block 8498421
import { PriceOracle } from '../types/cNote/PriceOracle'
// PriceOracle2 is valid from 8498422 until present block (until another proxy upgrade)
// import { PriceOracle2 } from '../types/cREP/PriceOracle2'
import { ERC20 } from '../types/cNote/ERC20'
import { CToken } from '../types/cNote/CToken'
import { Comptroller as ComptrollerContract } from '../types/Comptroller/Comptroller'

import { exponentToBigDecimal, powerToBigDecimal } from './helpers'
import {
  ADDRESS_ZERO,
  ATOM_ADDRESS,
  BaseV1Router_Address,
  BLOCK_TIME_BD,
  CantoAtom_ADDRESS,
  CantoEth_Address,
  CantoNote_Address,
  cATOM_ADDRESS,
  cCantoAtom_ADDRESS,
  cCantoEth_ADDRESS,
  cCantoNote_ADDRESS,
  cCANTO_ADDRESS,
  cETH_ADDRESS,
  cNoteUsdc_Address,
  cNoteUsdt_Address,
  cNOTE_ADDRESS,
  Comptroller_Address,
  cUSDC_ADDRESS,
  cUSDT_ADDRESS,
  DAYS_IN_YEAR,
  DAYS_IN_YEAR_BD,
  ETH_ADDRESS,
  HUNDRED_BD,
  MANTISSA_FACTOR,
  MANTISSA_FACTOR_BD,
  NegOne_BD,
  NoteUsdc_Address,
  NoteUsdt_Address,
  NOTE_ADDRESS,
  ONE_BD,
  SECONDS_IN_DAY_BD,
  USDC_ADDRESS,
  USDT_ADDRESS,
  ZERO_BD,
} from './consts'
import { TokenDefinition } from './tokenDefinition'

// Used for all cERC20 contracts
function getTokenPrice(
  blockNumber: i32,
  eventAddress: Address,
  underlyingAddress: Address,
  underlyingDecimals: i32,
): BigDecimal {
  log.info('MARKETS::getTokenPrice', [])
  let comptroller = Comptroller.load('1')
  let oracleAddress = comptroller.priceOracle as Address
  let underlyingPrice: BigDecimal = NegOne_BD
  if (oracleAddress.toHex() == '0x') {
    oracleAddress = Address.fromString(BaseV1Router_Address)
  }
  // log.info("getTokenPrice - {}", [oracleAddress.toHex()]);

  /* PriceOracle2 is used at the block the Comptroller starts using it.
   * see here https://etherscan.io/address/0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b#events
   * Search for event topic 0xd52b2b9b7e9ee655fcb95d2e5b9e0c9f69e7ef2b8e9d2d0ea78402d576d22e22,
   * and see block 7715908.
   *
   * This must use the cToken address.
   *
   * Note this returns the value without factoring in token decimals and wei, so we must divide
   * the number by (ethDecimals - tokenDecimals) and again by the mantissa.
   * USDC would be 10 ^ ((18 - 6) + 18) = 10 ^ 30
   *
   * Note that they deployed 3 different PriceOracles at the beginning of the Comptroller,
   * and that they handle the decimals different, which can break the subgraph. So we actually
   * defer to Oracle 1 before block 7715908, which works,
   * until this one is deployed, which was used for 121 days */
  /*
  todo
    1. how does mantissaDeicmalFactor work
    2. price oracle abi
    3. which block: if or else or both?
  */
  // if (blockNumber > 7715908) {
  let mantissaDecimalFactor = 18 + 18 - underlyingDecimals
  let bdFactor = exponentToBigDecimal(mantissaDecimalFactor)
  let oracle = PriceOracle.bind(oracleAddress)
  log.info('MARKETS::getTokenPrice {}', [oracleAddress.toHex()])

  let underlyingPriceResult = oracle.try_getUnderlyingPrice(eventAddress)
  if (!underlyingPriceResult.reverted) {
    underlyingPrice = underlyingPriceResult.value.toBigDecimal().div(bdFactor)
  }
  // underlyingPrice = oracle
  //   .getUnderlyingPrice(eventAddress)
  //   .toBigDecimal()
  //   .div(bdFactor)

  /* PriceOracle(1) is used (only for the first ~100 blocks of Comptroller. Annoying but we must
   * handle this. We use it for more than 100 blocks, see reason at top of if statement
   * of PriceOracle2.
   *
   * This must use the token address, not the cToken address.
   *
   * Note this returns the value already factoring in token decimals and wei, therefore
   * we only need to divide by the mantissa, 10^18 */
  // } else {
  //   let oracle1 = PriceOracle.bind(priceOracle1Address)
  //   underlyingPrice = oracle1
  //     .getPrice(underlyingAddress)
  //     .toBigDecimal()
  //     .div(mantissaFactorBD)
  // }
  return underlyingPrice
}

// Returns the price of USDC in eth. i.e. 0.005 would mean ETH is $200
function getUsdcPriceNOTE(blockNumber: i32): BigDecimal {
  log.info('MARKETS::getUsdcPriceNOTE', [])
  let comptroller = Comptroller.load('1')
  let oracleAddress = comptroller.priceOracle as Address
  if (oracleAddress.toHex() == '0x') {
    oracleAddress = Address.fromString(BaseV1Router_Address)
  }
  // log.info("getUSDCPrice - {}", [oracleAddress.toHex()])
  // let priceOracle1Address = Address.fromString('02557a5e05defeffd4cae6d83ea3d173b272c904')
  let USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 '
  let usdPrice: BigDecimal = NegOne_BD

  // See notes on block number if statement in getTokenPrices()
  /*
  todo:
    1. what is the abi of price oracle is it the same as base v1 router
    2. how does this mantissa decimal factor work
    3. is this the correct if block or do we have to use the next one
  */
  // if (blockNumber > 7715908) {
  log.info('MARKETS::getUsdcPriceNOTE {}', [oracleAddress.toHex()])
  let oracle = PriceOracle.bind(oracleAddress)
  let mantissaDecimalFactorUSDC = 18 + 18 - 6
  let bdFactorUSDC = exponentToBigDecimal(mantissaDecimalFactorUSDC)

  let underlyingPriceResult = oracle.try_getUnderlyingPrice(
    Address.fromString(cUSDC_ADDRESS),
  )
  if (!underlyingPriceResult.reverted) {
    usdPrice = underlyingPriceResult.value.toBigDecimal().div(bdFactorUSDC)
  }
  // usdPrice = oracle
  //   .getUnderlyingPrice(Address.fromString(cUSDC_ADDRESS))
  //   .toBigDecimal()
  //   .div(bdFactorUSDC)
  // } else {
  //   let oracle1 = PriceOracle.bind(priceOracle1Address)
  //   usdPrice = oracle1
  //     .getPrice(Address.fromString(USDCAddress))
  //     .toBigDecimal()
  //     .div(mantissaFactorBD)
  // }
  return usdPrice
}

export function createMarket(marketAddress: string): Market {
  log.info('MARKETS::createMarket', [])
  let market: Market
  let contract = CToken.bind(Address.fromString(marketAddress))

  log.info('MARKETS::createMarket->1', [])

  // It is CETH, which has a slightly different interface
  if (marketAddress == cCANTO_ADDRESS) {
    market = new Market(marketAddress)
    market.underlyingAddress = Address.fromString(
      '0x0000000000000000000000000000000000000000',
    )
    market.underlyingDecimals = 18
    market.underlyingPrice = BigDecimal.fromString('1')
    market.underlyingName = 'Canto'
    market.underlyingSymbol = 'CANTO'

    // It is all other CERC20 contracts
  } else {
    market = new Market(marketAddress)

    market.underlyingAddress = cToken_underlyingAddress(marketAddress, contract)
    log.info('MARKETS::createMarket->2', [])

    let underlyingContract = ERC20.bind(market.underlyingAddress as Address)

    market.underlyingDecimals = erc20_decimals(
      market.underlyingAddress.toHex(),
      underlyingContract,
    )
    log.info('MARKETS::createMarket->3 {}', [market.underlyingAddress.toHex()])

    market.underlyingName = erc20_symbol(
      market.underlyingAddress.toHex(),
      underlyingContract,
    )
    market.underlyingSymbol = erc20_symbol(
      market.underlyingAddress.toHex(),
      underlyingContract,
    )

    if (marketAddress == cUSDC_ADDRESS) {
      market.underlyingPriceUSD = BigDecimal.fromString('1')
    }
  }

  market.borrowRate = ZERO_BD
  market.borrowAPY = ZERO_BD
  market.borrowDistributionAPY = ZERO_BD
  market.cash = ZERO_BD
  market.collateralFactor = ZERO_BD
  market.exchangeRate = ZERO_BD
  market.interestRateModelAddress = Address.fromString(
    '0x0000000000000000000000000000000000000000',
  )

  market.name = cToken_symbol(marketAddress, contract)
  market.numberOfBorrowers = 0
  market.numberOfSuppliers = 0
  market.reserves = ZERO_BD
  market.supplyRate = ZERO_BD
  market.supplyAPY = ZERO_BD
  market.supplyDistributionAPY = ZERO_BD
  market.symbol = cToken_symbol(marketAddress, contract)
  market.totalBorrows = ZERO_BD
  market.totalSupply = ZERO_BD
  market.underlyingPrice = ZERO_BD

  market.accrualBlockNumber = 0
  market.blockTimestamp = 0
  market.borrowIndex = ZERO_BD
  market.reserveFactor = BigInt.fromI32(0)
  market.underlyingPriceUSD = ZERO_BD

  return market
}

function erc20_decimals(address: string, contract: ERC20): i32 {
  let staticDefinition = TokenDefinition.fromAddress(Address.fromString(address))
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).decimals
  }

  // HACKY - handling of runtine errors
  let decimals: i32 = 0
  let result = contract.try_decimals()
  if (!result.reverted) {
    decimals = result.value
  } else {
    log.info('CUSTOM' + address.toString(), [])
  }

  return decimals
}

function erc20_symbol(address: string, contract: ERC20): string {
  let staticDefinition = TokenDefinition.fromAddress(Address.fromString(address))
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).symbol
  }

  // HACKY - handling of runtine errors
  let symbol = 'N/A'
  let result = contract.try_symbol()
  if (!result.reverted) {
    symbol = result.value
  } else {
    log.info('CUSTOM' + address.toString(), [])
  }

  return symbol
}

function cToken_name(marketAddress: string, contract: CToken): string {
  log.info('MARKETS::cToken_underlyingAddress {}', [marketAddress])
  let name = 'N/A'
  // HACKY - handling of runtine errors
  if (marketAddress == cNOTE_ADDRESS) {
    log.info('MARKETS::cToken_name -> cNOTE_ADDRESS', [])
    name = 'cNOTE'
  } else if (marketAddress == cCANTO_ADDRESS) {
    name = 'cCANTO'
  } else if (marketAddress == cATOM_ADDRESS) {
    name = 'cATOM'
  } else if (marketAddress == cETH_ADDRESS) {
    name = 'cETH'
  } else {
    let result = contract.try_name()
    if (!result.reverted) {
      name = result.value
    } else {
      log.info('CUSTOM' + marketAddress.toString(), [])
    }
  }

  return name
}

function cToken_symbol(marketAddress: string, contract: CToken): string {
  log.info('MARKETS::cToken_symbol {}', [marketAddress])
  let symbol = 'N/A'
  // HACKY - handling of runtine errors
  if (marketAddress == cNOTE_ADDRESS) {
    log.info('MARKETS::cToken_symbol -> cNOTE_ADDRESS', [])
    symbol = 'cNOTE'
  } else if (marketAddress == cCANTO_ADDRESS) {
    symbol = 'cCANTO'
  } else if (marketAddress == cATOM_ADDRESS) {
    symbol = 'cATOM'
  } else if (marketAddress == cETH_ADDRESS) {
    symbol = 'cETH'
  } else if (marketAddress == cUSDC_ADDRESS) {
    symbol = 'cUSDC'
  } else if (marketAddress == cUSDT_ADDRESS) {
    symbol = 'cUSDT'
  } else if (marketAddress == cCantoNote_ADDRESS) {
    symbol = 'cCANTO/NOTE'
  } else if (marketAddress == cCantoEth_ADDRESS) {
    symbol = 'cCANTO/ETH'
  } else if (marketAddress == cCantoAtom_ADDRESS) {
    symbol = 'cCANTO/ATOM'
  } else if (marketAddress == cNoteUsdc_Address) {
    symbol = 'cNOTE/USDC'
  } else if (marketAddress == cNoteUsdt_Address) {
    symbol = 'cNOTE/USDT'
  } else {
    let result = contract.try_name()
    if (!result.reverted) {
      symbol = result.value
    } else {
      log.info('CUSTOM' + marketAddress.toString(), [])
    }
  }

  return symbol
}

function cToken_underlyingAddress(marketAddress: string, contract: CToken): Address {
  log.info('MARKETS::cToken_underlyingAddress {}', [marketAddress])
  let underlyingAddress = ADDRESS_ZERO
  // HACKY - handling of runtine errors
  if (marketAddress == cNOTE_ADDRESS) {
    log.info('MARKETS::cToken_underlyingAddress -> cNOTE_ADDRESS', [])
    underlyingAddress = NOTE_ADDRESS
  } else if (marketAddress == cCANTO_ADDRESS) {
    underlyingAddress = ADDRESS_ZERO
  } else if (marketAddress == cATOM_ADDRESS) {
    underlyingAddress = ATOM_ADDRESS
  } else if (marketAddress == cETH_ADDRESS) {
    underlyingAddress = ETH_ADDRESS
  } else if (marketAddress == cUSDC_ADDRESS) {
    underlyingAddress = USDC_ADDRESS
  } else if (marketAddress == cUSDT_ADDRESS) {
    underlyingAddress = USDT_ADDRESS
  } else if (marketAddress == cCantoNote_ADDRESS) {
    underlyingAddress = CantoNote_Address
  } else if (marketAddress == cCantoEth_ADDRESS) {
    underlyingAddress = CantoEth_Address
  } else if (marketAddress == cCantoAtom_ADDRESS) {
    underlyingAddress = CantoAtom_ADDRESS
  } else if (marketAddress == cNoteUsdc_Address) {
    underlyingAddress = NoteUsdc_Address
  } else if (marketAddress == cNoteUsdt_Address) {
    underlyingAddress = NoteUsdt_Address
  } else {
    let underlyingAddressResult = contract.try_underlying()
    log.info('MARKETS::createMarket->2 {}', [])
    if (!underlyingAddressResult.reverted) {
      underlyingAddress = underlyingAddressResult.value.toHex()
    } else {
      log.info('CUSTOM' + marketAddress.toString(), [])
    }
  }

  return Address.fromString(underlyingAddress)
}

export function updateMarket(
  marketAddress: Address,
  blockNumber: i32,
  blockTimestamp: i32,
): Market | null {
  // log.info("MARKETS::updateMarket {} {} {}", [marketAddress.toHex(), blockNumber.toString(), blockTimestamp.toString()])
  let marketID = marketAddress.toHex()
  let market = Market.load(marketID)
  if (market == null) {
    market = createMarket(marketID)
  }

  // Only updateMarket if it has not been updated this block
  if (market.accrualBlockNumber != blockNumber) {
    let contractAddress = Address.fromString(market.id)
    let contract = CToken.bind(contractAddress)
    let usdPriceInNote = getUsdcPriceNOTE(blockNumber)

    if (usdPriceInNote.equals(NegOne_BD)) {
      return null
    }

    // if cETH, we only update USD price
    if (market.id == cCANTO_ADDRESS) {
      let tokenPriceNote = getTokenPrice(
        blockNumber,
        contractAddress,
        market.underlyingAddress as Address,
        market.underlyingDecimals,
      )
      if (tokenPriceNote.equals(NegOne_BD)) {
        return null
      }
      market.underlyingPrice = tokenPriceNote.truncate(market.underlyingDecimals)
      market.underlyingPriceUSD = market.underlyingPrice
        .div(usdPriceInNote)
        .truncate(market.underlyingDecimals)
    } else {
      let tokenPriceNote = getTokenPrice(
        blockNumber,
        contractAddress,
        market.underlyingAddress as Address,
        market.underlyingDecimals,
      )

      if (tokenPriceNote.equals(NegOne_BD)) {
        return null
      }

      market.underlyingPrice = tokenPriceNote.truncate(market.underlyingDecimals)
      // if USDC, we only update ETH price
      if (market.id != cUSDC_ADDRESS) {
        market.underlyingPriceUSD = market.underlyingPrice
          .div(usdPriceInNote)
          .truncate(market.underlyingDecimals)
      }
    }

    market.accrualBlockNumber = contract.accrualBlockNumber().toI32()
    market.blockTimestamp = blockTimestamp

    let cTOKEN_DECIMALS = contract.decimals()
    let cTOKEN_DECIMALS_BD = exponentToBigDecimal(cTOKEN_DECIMALS)
    market.totalSupply = contract
      .totalSupply()
      .toBigDecimal()
      .div(cTOKEN_DECIMALS_BD)

    /* Exchange rate explanation
       In Practice
        - If you call the cDAI contract on etherscan it comes back (2.0 * 10^26)
        - If you call the cUSDC contract on etherscan it comes back (2.0 * 10^14)
        - The real value is ~0.02. So cDAI is off by 10^28, and cUSDC 10^16
       How to calculate for tokens with different decimals
        - Must div by tokenDecimals, 10^market.underlyingDecimals
        - Must multiply by ctokenDecimals, 10^8
        - Must div by mantissa, 10^18
     */
    market.exchangeRate = contract
      .exchangeRateStored()
      .toBigDecimal()
      .div(exponentToBigDecimal(market.underlyingDecimals))
      .times(cTOKEN_DECIMALS_BD)
      .div(MANTISSA_FACTOR_BD)
      .truncate(MANTISSA_FACTOR)

    market.borrowIndex = contract
      .borrowIndex()
      .toBigDecimal()
      .div(MANTISSA_FACTOR_BD)
      .truncate(MANTISSA_FACTOR)

    market.reserves = contract
      .totalReserves()
      .toBigDecimal()
      .div(exponentToBigDecimal(market.underlyingDecimals))
      .truncate(market.underlyingDecimals)

    market.totalBorrows = contract
      .totalBorrows()
      .toBigDecimal()
      .div(exponentToBigDecimal(market.underlyingDecimals))
      .truncate(market.underlyingDecimals)

    market.cash = contract
      .getCash()
      .toBigDecimal()
      .div(exponentToBigDecimal(market.underlyingDecimals))
      .truncate(market.underlyingDecimals)

    // SUPPLY
    let supplyRateResult = contract.try_supplyRatePerBlock()
    let supplyRate = ZERO_BD
    if (!supplyRateResult.reverted) {
      supplyRate = supplyRateResult.value.toBigDecimal()
    }

    market.supplyRate = calculateRatePerYear(supplyRate)
    market.supplyAPY = calculateAPY(supplyRate)

    // BORROW
    let borrowRateResult = contract.try_borrowRatePerBlock()
    let borrowRate = ZERO_BD
    if (!borrowRateResult.reverted) {
      borrowRate = borrowRateResult.value.toBigDecimal()
    }

    market.borrowRate = calculateRatePerYear(borrowRate)
    market.borrowAPY = calculateAPY(borrowRate)

    // DISTRIBUTION APY
    let comptrollerContract = ComptrollerContract.bind(
      Address.fromString(Comptroller_Address),
    )

    let cashResult = contract.try_getCash()
    let cash = ZERO_BD
    if (!cashResult.reverted) {
      cash = cashResult.value.toBigDecimal()
    }

    // Supply Distribution APY
    let compSupplySpeedResult = comptrollerContract.try_compSupplySpeeds(marketAddress)
    let compSupplySpeed = ZERO_BD
    if (!compSupplySpeedResult.reverted) {
      compSupplySpeed = compSupplySpeedResult.value.toBigDecimal()
      log.info('SupplyCompSpeed - true {} {}', [
        marketAddress.toHex(),
        compSupplySpeed.toString(),
      ])
    } else {
      log.info('SupplyCompSpeed - false {} {}', [
        marketAddress.toHex(),
        compSupplySpeed.toString(),
      ])
    }

    let tokenPrice = getTokenPrice(
      blockNumber,
      contractAddress,
      market.underlyingAddress as Address,
      market.underlyingDecimals,
    )
    let cCantoPrice = getTokenPrice(
      blockNumber,
      Address.fromString(cCANTO_ADDRESS),
      market.underlyingAddress as Address,
      market.underlyingDecimals,
    )

    market.supplyDistributionAPY = calculateDistributionAPY(
      compSupplySpeed,
      cash,
      tokenPrice,
      cCantoPrice,
    )

    // Borrow Distribution APY
    let compBorrowSpeedResult = comptrollerContract.try_compBorrowSpeeds(marketAddress)
    let compBorrowSpeed = ZERO_BD
    if (!compBorrowSpeedResult.reverted) {
      compBorrowSpeed = compBorrowSpeedResult.value.toBigDecimal()
      log.info('BorrowCompSpeed - true {} {}', [
        marketAddress.toHex(),
        compBorrowSpeed.toString(),
      ])
    } else {
      log.info('BorrowCompSpeed - false {} {}', [
        marketAddress.toHex(),
        compBorrowSpeed.toString(),
      ])
    }

    market.borrowDistributionAPY = calculateDistributionAPY(
      compBorrowSpeed,
      cash,
      tokenPrice,
      cCantoPrice,
    )

    // Must convert to BigDecimal, and remove 10^18 that is used for Exp in Compound Solidity
    market.save()
  }
  return market as Market
}

function calculateRatePerYear(ratePerBlock: BigDecimal): BigDecimal {
  let rate = BigDecimal.fromString(ratePerBlock.toString())
  let secondsInYear = DAYS_IN_YEAR_BD.times(SECONDS_IN_DAY_BD)
  let blocksPerYear = secondsInYear.div(BLOCK_TIME_BD)

  let ratePerYear = rate
    .times(blocksPerYear)
    .div(MANTISSA_FACTOR_BD)
    .truncate(MANTISSA_FACTOR)

  return ratePerYear
}

function calculateAPY(ratePerBlock: BigDecimal): BigDecimal {
  let blocksPerDay = SECONDS_IN_DAY_BD.div(BLOCK_TIME_BD)
  let mantissa = exponentToBigDecimal(MANTISSA_FACTOR)
  let denom = mantissa
  // let denom = mantissa.times(blockPerDay);
  let rate = BigDecimal.fromString(ratePerBlock.toString())
  let frac = rate.times(blocksPerDay).div(denom)
  let a = frac.plus(ONE_BD)
  let b = powerToBigDecimal(a, DAYS_IN_YEAR)
  let c = b.minus(ONE_BD)

  // calculate apy
  let apy = c.times(HUNDRED_BD)

  log.info('APY::calc {} {}', [ratePerBlock.toString(), apy.toString()])
  return apy
}

function calculateDistributionAPY(
  compSpeed: BigDecimal,
  tokenSupply: BigDecimal,
  tokenPrice: BigDecimal,
  priceOfCanto: BigDecimal,
): BigDecimal {
  log.info('Dist APY {} {} {} {}', [
    compSpeed.toString(),
    tokenSupply.toString(),
    tokenPrice.toString(),
    priceOfCanto.toString(),
  ])
  if (tokenSupply.equals(ZERO_BD) || tokenPrice.equals(ZERO_BD)) {
    return ZERO_BD
  }

  let blocksPerDay = SECONDS_IN_DAY_BD.div(BLOCK_TIME_BD)
  let blocksPerYear = blocksPerDay.times(DAYS_IN_YEAR_BD)
  let distApy = compSpeed
    .times(blocksPerYear)
    .div(tokenSupply)
    .times(priceOfCanto.div(tokenPrice))
    .times(HUNDRED_BD)

  return distApy
}
