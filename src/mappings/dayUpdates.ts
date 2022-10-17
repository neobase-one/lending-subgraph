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

    marketDayData.dailyVolumeNOTE = ZERO_BD
    marketDayData.dailyVolumeUSD = ZERO_BD

    marketDayData.totalVolumeNOTE = ZERO_BD
    marketDayData.totalVolumeUSD = ZERO_BD

    marketDayData.totalLiquidityNOTE = ZERO_BD
    marketDayData.totalLiquidityUSD = ZERO_BD

    marketDayData.dailyTxns = ZERO_BI
  }

  // todo: update fields daily volume fields
  marketDayData.totalLiquidityNOTE = getLiquidity(market)
  marketDayData.totalLiquidityUSD = getLiquidityUSD(market)

  marketDayData.dailyTxns = marketDayData.dailyTxns.plus(ONE_BI)
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
    marketHourData.hourlyVolumeNOTE = ZERO_BD
    marketHourData.hourlyVolumeUSD = ZERO_BD

    marketHourData.totalVolumeNOTE = ZERO_BD
    marketHourData.totalVolumeUSD = ZERO_BD

    marketHourData.totalLiquidityNOTE = ZERO_BD
    marketHourData.totalLiquidityUSD = ZERO_BD

    marketHourData.hourlyTxns = ZERO_BI
  }

  // todo: update volume

  marketHourData.totalLiquidityNOTE = getLiquidity(market)
  marketHourData.totalLiquidityUSD = getLiquidityUSD(market)

  marketHourData.hourlyTxns = marketHourData.hourlyTxns.plus(ONE_BI)

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
    compDayData.dailyVolumeNOTE = ZERO_BD
    compDayData.dailyVolumeUSD = ZERO_BD

    compDayData.totalVolumeNOTE = ZERO_BD
    compDayData.totalVolumeUSD = ZERO_BD

    compDayData.totalLiquidityNOTE = ZERO_BD
    compDayData.totalLiquidityUSD = ZERO_BD

    compDayData.dailyTxns = ZERO_BI
  }

  // todo: update volume, liquidity
  compDayData.dailyTxns = compDayData.dailyTxns.plus(ONE_BI)

  compDayData.totalLiquidityNOTE = comptroller.totalLiquidityNOTE
  compDayData.totalLiquidityUSD = comptroller.totalLiquidityUSD

  compDayData.save()
  return compDayData as ComptrollerDayData
}
