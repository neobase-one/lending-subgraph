import { EthereumEvent, BigInt } from '@graphprotocol/graph-ts'
import {
  Comptroller,
  ComptrollerDayData,
  Market,
  MarketDayData,
  MarketHourData,
} from '../types/schema'
import { Comptroller_Address, ONE_BI, ZERO_BD, ZERO_BI } from './consts'
import { createMarket, getLiquidity, getLiquidityUSD } from './markets'

export function updateMarketDayData(event: EthereumEvent): MarketDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayId = timestamp / 86400
  let dayStartTimestamp = dayId * 86400
  let marketDayId = event.address
    .toHexString()
    .concat('-')
    .concat(BigInt.fromI32(dayId).toString())

  let marketId = event.address.toHexString()
  let market = Market.load(marketId) as Market
  if (market === null) {
    market = createMarket(marketId)
  }
  let marketDayData = MarketDayData.load(marketDayId)

  if (marketDayData === null) {
    marketDayData = new MarketDayData(marketDayId)
    marketDayData.date = dayStartTimestamp
    marketDayData.market = market.id

    marketDayData.dailySupplyVolumeNOTE = ZERO_BD
    marketDayData.dailySupplyVolumeUSD = ZERO_BD
    marketDayData.dailyBorrowVolumeNOTE = ZERO_BD
    marketDayData.dailyBorrowVolumeUSD = ZERO_BD

    marketDayData.totalLiquidityNOTE = ZERO_BD
    marketDayData.totalLiquidityUSD = ZERO_BD

    marketDayData.dailySupplyTxns = ZERO_BI
    marketDayData.dailyBorrowTxns = ZERO_BI
  }

  // todo: update fields daily volume fields
  marketDayData.totalLiquidityNOTE = getLiquidity(market)
  marketDayData.totalLiquidityUSD = getLiquidityUSD(market)

  marketDayData.save()

  return marketDayData as MarketDayData
}

export function updateMarketHourData(event: EthereumEvent): MarketHourData {
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600
  let hourStartUnix = hourIndex * 3600

  let marketId = event.address.toHexString()

  let marketHourId = marketId.concat('-').concat(BigInt.fromI32(hourIndex).toString())

  let market = Market.load(marketId) as Market
  if (market === null) {
    market = createMarket(marketId)
  }

  let marketHourData = MarketHourData.load(marketHourId)
  if (marketHourData === null) {
    marketHourData = new MarketHourData(marketHourId)
    marketHourData.market = market.id
    marketHourData.hourStartUnix = hourStartUnix

    marketHourData.hourlySupplyVolumeNOTE = ZERO_BD
    marketHourData.hourlySupplyVolumeUSD = ZERO_BD
    marketHourData.hourlyBorrowVolumeNOTE = ZERO_BD
    marketHourData.hourlyBorrowVolumeUSD = ZERO_BD

    marketHourData.totalLiquidityNOTE = ZERO_BD
    marketHourData.totalLiquidityUSD = ZERO_BD

    marketHourData.hourlySupplyTxns = ZERO_BI
    marketHourData.hourlyBorrowTxns = ZERO_BI
  }

  // todo: update volume

  marketHourData.totalLiquidityNOTE = getLiquidity(market)
  marketHourData.totalLiquidityUSD = getLiquidityUSD(market)

  marketHourData.save()
  return marketHourData as MarketHourData
}

export function updateComptrollerDayData(event: EthereumEvent): ComptrollerDayData {
  // let comptroller = Comptroller.load(Comptroller_Address)

  let timestamp = event.block.timestamp.toI32()
  let dayId = timestamp / 86400
  let dayStartTimestamp = dayId * 86400

  let comptroller = Comptroller.load('1') as Comptroller
  let compDayData = ComptrollerDayData.load(dayId.toString())
  if (compDayData === null) {
    compDayData = new ComptrollerDayData(dayId.toString())
    compDayData.date = dayStartTimestamp

    compDayData.dailySupplyVolumeNOTE = ZERO_BD
    compDayData.dailySupplyVolumeUSD = ZERO_BD
    compDayData.dailyBorrowVolumeNOTE = ZERO_BD
    compDayData.dailyBorrowVolumeUSD = ZERO_BD

    compDayData.totalLiquidityNOTE = ZERO_BD
    compDayData.totalLiquidityUSD = ZERO_BD

    compDayData.dailySupplyTxns = ZERO_BI
    compDayData.dailyBorrowTxns = ZERO_BI
  }

  // todo: update volume, liquidity
  compDayData.totalLiquidityNOTE = comptroller.totalLiquidityNOTE
  compDayData.totalLiquidityUSD = comptroller.totalLiquidityUSD

  compDayData.save()
  return compDayData as ComptrollerDayData
}
