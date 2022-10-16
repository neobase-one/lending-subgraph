import { EthereumEvent } from '@graphprotocol/graph-ts'
import { createMappedTypeNode } from 'typescript'
import {
  Comptroller,
  ComptrollerDayData,
  Market,
  MarketDayData,
  MarketHourData,
} from '../types/schema'
import { Comptroller_Address, ONE_BI, ZERO_BD, ZERO_BI } from './consts'
import { createMarket } from './markets'

export function updateMarketDayData(event: EthereumEvent): MarketDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayId = timestamp / 86400
  let dayStartTimestamp = dayId * 86400
  let marketDayId = event.address
    .toHexString()
    .concat('-')
    .concat(BigInt.fromI32(dayId).toString())

  let marketId = event.address.toHexString()
  let market = Market.load(marketId)
  if (market == null) {
    market = createMarket(marketId)
  }
  let marketDayData = MarketDayData.load(marketDayId)

  if (marketDayData === null) {
    marketDayData = new MarketDayData(marketDayId)
    marketDayData.date = dayStartTimestamp
    marketDayData.dailyVolumeETH = ZERO_BD
    marketDayData.dailyVolumeUSD = ZERO_BD

    marketDayData.totalVolumeETH = ZERO_BD
    marketDayData.totalVolumeUSD = ZERO_BD

    marketDayData.totalLiquidityETH = ZERO_BD
    marketDayData.totalLiquidityUSD = ZERO_BD

    marketDayData.dailyTxns = ZERO_BI
  }

  // todo: update fields daily volume fields
  marketDayData.totalLiquidityETH = market.liquidity
  marketDayData.totalLiquidityUSD = market.liquidityUSD

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

  let market = Market.load(marketId)
  if (market === null) {
    market = createMarket(marketId)
  }

  let marketHourData = MarketHourData.load(marketHourId)
  if (marketHourData === null) {
    marketHourData = new MarketHourData(marketHourId)
    marketHourData.hourStartUnix = hourStartUnix
    marketHourData.hourlyVolumeETH = ZERO_BD
    marketHourData.hourlyVolumeUSD = ZERO_BD

    marketHourData.totalVolumeETH = ZERO_BD
    marketHourData.totalVolumeUSD = ZERO_BD

    marketHourData.totalLiquidityETH = ZERO_BD
    marketHourData.totalLiquidityUSD = ZERO_BD

    marketHourData.hourlyTxns = ZERO_BI
  }

  // todo: update volume

  marketHourData.totalLiquidityETH = market.liquidity
  marketHourData.totalLiquidityUSD = market.liquidityUSD

  marketHourData.hourlyTxns = marketHourData.hourlyTxns.plus(ONE_BI)

  marketHourData.save()
  return marketHourData as MarketHourData
}

export function updateComptrollerDayData(event: EthereumEvent): ComptrollerDayData {
  // let comptroller = Comptroller.load(Comptroller_Address)

  let timestamp = event.block.timestamp.toI32()
  let dayId = timestamp / 86400
  let dayStartTimestamp = dayId * 86400

  let compDayData = ComptrollerDayData.load(dayId.toString())
  if (compDayData === null) {
    compDayData = new ComptrollerDayData(dayId.toString())
    compDayData.date = dayStartTimestamp
    compDayData.dailyVolumeETH = ZERO_BD
    compDayData.dailyVolumeUSD = ZERO_BD

    compDayData.totalVolumeETH = ZERO_BD
    compDayData.totalVolumeUSD = ZERO_BD

    compDayData.totalLiquidityETH = ZERO_BD
    compDayData.totalLiquidityUSD = ZERO_BD

    compDayData.dailyTxns = ZERO_BI
  }

  // todo: update volume, liquidity
  compDayData.dailyTxns = compDayData.dailyTxns.plus(ONE_BI)

  return compDayData as ComptrollerDayData
}
