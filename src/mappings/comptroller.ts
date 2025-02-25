/* eslint-disable prefer-const */ // to satisfy AS compiler

import { log } from '@graphprotocol/graph-ts'
import {
  MarketEntered,
  MarketExited,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  // NewMaxAssets,
  NewPriceOracle,
} from '../types/Comptroller/Comptroller'

import { Market, Comptroller } from '../types/schema'
import { MANTISSA_FACTOR_BD, ZERO_BD } from './consts'
import { updateCommonCTokenStats } from './helpers'
import { createMarket } from './markets'

export function handleMarketEntered(event: MarketEntered): void {
  let marketId = event.params.cToken.toHexString()
  let market = Market.load(marketId)
  if (market == null) {
    market = createMarket(marketId)
  }
  let accountID = event.params.account.toHex()
  let cTokenStats = updateCommonCTokenStats(
    market.id,
    market.symbol,
    accountID,
    event.transaction.hash,
    event.block.timestamp.toI32(),
    event.block.number.toI32(),
  )
  cTokenStats.enteredMarket = true
  cTokenStats.save()
}

export function handleMarketExited(event: MarketExited): void {
  let marketId = event.params.cToken.toHexString()
  let market = Market.load(marketId)
  if (market === null) {
    market = createMarket(marketId)
  }
  let accountID = event.params.account.toHex()
  let cTokenStats = updateCommonCTokenStats(
    market.id,
    market.symbol,
    accountID,
    event.transaction.hash,
    event.block.timestamp.toI32(),
    event.block.number.toI32(),
  )
  cTokenStats.enteredMarket = false
  cTokenStats.save()
}

export function handleNewCloseFactor(event: NewCloseFactor): void {
  let comptroller = Comptroller.load('1')
  comptroller.closeFactor = event.params.newCloseFactorMantissa
  comptroller.save()
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let marketId = event.params.cToken.toHex()
  let market = Market.load(marketId)
  if (market == null) {
    market = createMarket(marketId)
  }
  market.collateralFactor = event.params.newCollateralFactorMantissa
    .toBigDecimal()
    .div(MANTISSA_FACTOR_BD)
  market.save()
}

// This should be the first event acccording to etherscan but it isn't.... price oracle is. weird
export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  let comptroller = Comptroller.load('1')
  comptroller.liquidationIncentive = event.params.newLiquidationIncentiveMantissa
  comptroller.save()
}

// export function handleNewMaxAssets(event: NewMaxAssets): void {
//   let comptroller = Comptroller.load('1')
//   comptroller.maxAssets = event.params.newMaxAssets
//   comptroller.save()
// }

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let comptroller = Comptroller.load('1')
  // This is the first event used in this mapping, so we use it to create the entity
  if (comptroller == null) {
    comptroller = new Comptroller('1')
    comptroller.totalLiquidityNOTE = ZERO_BD
    comptroller.totalLiquidityUSD = ZERO_BD
  }
  comptroller.priceOracle = event.params.newPriceOracle
  comptroller.save()
}
