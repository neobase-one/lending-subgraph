/* eslint-disable prefer-const */ // to satisfy AS compiler
import {
  Mint,
  Redeem,
  Borrow,
  RepayBorrow,
  LiquidateBorrow,
  Transfer,
  AccrueInterest,
  NewReserveFactor,
  NewMarketInterestRateModel,
} from '../types/cNote/CToken'
import { AccountCToken, Market, Account } from '../types/schema'

import { createMarket, getVolumePrice, getVolumePriceUSD, updateMarket } from './markets'
import { createAccount, updateCommonCTokenStats, exponentToBigDecimal } from './helpers'
import { log } from '@graphprotocol/graph-ts'
import { cTOKEN_DECIMALS, cTOKEN_DECIMALS_BD, ONE_BI, ZERO_BD } from './consts'
import {
  updateComptrollerDayData,
  updateMarketDayData,
  updateMarketHourData,
} from './dayUpdates'

/* Account supplies assets into market and receives cTokens in exchange
 *
 * event.mintAmount is the underlying asset
 * event.mintTokens is the amount of cTokens minted
 * event.minter is the account
 *
 * Notes
 *    Transfer event will always get emitted with this
 *    Mints originate from the cToken address, not 0x000000, which is typical of ERC-20s
 *    No need to updateMarket(), handleAccrueInterest() ALWAYS runs before this
 *    No need to updateCommonCTokenStats, handleTransfer() will
 *    No need to update cTokenBalance, handleTransfer() will
 */
export function handleMint(event: Mint): void {
  // Currently not in use. Everything can be done in handleTransfer, since a Mint event
  // is always done alongside a Transfer event, with the same data
}

/*  Account supplies cTokens into market and receives underlying asset in exchange
 *
 *  event.redeemAmount is the underlying asset
 *  event.redeemTokens is the cTokens
 *  event.redeemer is the account
 *
 *  Notes
 *    Transfer event will always get emitted with this
 *    No need to updateMarket(), handleAccrueInterest() ALWAYS runs before this
 *    No need to updateCommonCTokenStats, handleTransfer() will
 *    No need to update cTokenBalance, handleTransfer() will
 */
export function handleRedeem(event: Redeem): void {
  // Currently not in use. Everything can be done in handleTransfer, since a Redeem event
  // is always done alongside a Transfer event, with the same data
}

/* Borrow assets from the protocol. All values either ETH or ERC20
 *
 * event.params.totalBorrows = of the whole market (not used right now)
 * event.params.accountBorrows = total of the account
 * event.params.borrowAmount = that was added in this event
 * event.params.borrower = the account
 * Notes
 *    No need to updateMarket(), handleAccrueInterest() ALWAYS runs before this
 */
export function handleBorrow(event: Borrow): void {
  let marketId = event.address.toHex()
  let market = Market.load(marketId) as Market
  if (market == null) {
    market = createMarket(marketId)
  }
  let accountID = event.params.borrower.toHex()

  // Update cTokenStats common for all events, and return the stats to update unique
  // values for each event
  let cTokenStats = updateCommonCTokenStats(
    market.id,
    market.symbol,
    accountID,
    event.transaction.hash,
    event.block.timestamp.toI32(),
    event.block.number.toI32(),
  )

  let borrowAmountBD = event.params.borrowAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(market.underlyingDecimals))
  let previousBorrow = cTokenStats.storedBorrowBalance

  cTokenStats.storedBorrowBalance = event.params.accountBorrows
    .toBigDecimal()
    .div(exponentToBigDecimal(market.underlyingDecimals))
    .truncate(market.underlyingDecimals)

  cTokenStats.accountBorrowIndex = market.borrowIndex
  cTokenStats.totalUnderlyingBorrowed = cTokenStats.totalUnderlyingBorrowed.plus(
    borrowAmountBD,
  )
  cTokenStats.save()

  let account = Account.load(accountID)
  if (account == null) {
    account = createAccount(accountID)
  }
  account.hasBorrowed = true
  account.save()

  if (
    previousBorrow.equals(ZERO_BD) &&
    !event.params.accountBorrows.toBigDecimal().equals(ZERO_BD) // checking edge case for borrwing 0
  ) {
    market.numberOfBorrowers = market.numberOfBorrowers + 1
    market.save()

    // todo - volume verify - borrow
    let comptrollerDayData = updateComptrollerDayData(event)
    let marketHourData = updateMarketHourData(event)
    let marketDayData = updateMarketDayData(event)

    let volume = getVolumePrice(event.params.borrowAmount, market)
    let volumeUSD = getVolumePriceUSD(event.params.borrowAmount, market)

    comptrollerDayData.dailyBorrowTxns = comptrollerDayData.dailyBorrowTxns.plus(ONE_BI)
    comptrollerDayData.dailyBorrowVolumeNOTE = comptrollerDayData.dailyBorrowVolumeNOTE.plus(
      volume,
    )
    comptrollerDayData.dailyBorrowVolumeUSD = comptrollerDayData.dailyBorrowVolumeUSD.plus(
      volumeUSD,
    )
    comptrollerDayData.save()

    marketHourData.hourlyBorrowTxns = marketHourData.hourlyBorrowTxns.plus(ONE_BI)
    marketHourData.hourlyBorrowVolumeNOTE = marketHourData.hourlyBorrowVolumeNOTE.plus(
      volume,
    )
    marketHourData.hourlyBorrowVolumeUSD = marketHourData.hourlyBorrowVolumeUSD.plus(
      volumeUSD,
    )
    marketHourData.save()

    marketDayData.dailyBorrowTxns = marketDayData.dailyBorrowTxns.plus(ONE_BI)
    marketDayData.dailyBorrowVolumeNOTE = marketDayData.dailyBorrowVolumeNOTE.plus(volume)
    marketDayData.dailyBorrowVolumeUSD = marketDayData.dailyBorrowVolumeUSD.plus(
      volumeUSD,
    )
    marketDayData.save()
  }
}

/* Repay some amount borrowed. Anyone can repay anyones balance
 *
 * event.params.totalBorrows = of the whole market (not used right now)
 * event.params.accountBorrows = total of the account (not used right now)
 * event.params.repayAmount = that was added in this event
 * event.params.borrower = the borrower
 * event.params.payer = the payer
 *
 * Notes
 *    No need to updateMarket(), handleAccrueInterest() ALWAYS runs before this
 *    Once a account totally repays a borrow, it still has its account interest index set to the
 *    markets value. We keep this, even though you might think it would reset to 0 upon full
 *    repay.
 */
export function handleRepayBorrow(event: RepayBorrow): void {
  let marketId = event.address.toHex()
  let market = Market.load(marketId) as Market
  if (market == null) {
    market = createMarket(marketId)
  }
  let accountID = event.params.borrower.toHex()

  // Update cTokenStats common for all events, and return the stats to update unique
  // values for each event
  let cTokenStats = updateCommonCTokenStats(
    market.id,
    market.symbol,
    accountID,
    event.transaction.hash,
    event.block.timestamp.toI32(),
    event.block.number.toI32(),
  )

  let repayAmountBD = event.params.repayAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(market.underlyingDecimals))

  cTokenStats.storedBorrowBalance = event.params.accountBorrows
    .toBigDecimal()
    .div(exponentToBigDecimal(market.underlyingDecimals))
    .truncate(market.underlyingDecimals)

  cTokenStats.accountBorrowIndex = market.borrowIndex
  cTokenStats.totalUnderlyingRepaid = cTokenStats.totalUnderlyingRepaid.plus(
    repayAmountBD,
  )
  cTokenStats.save()

  let account = Account.load(accountID)
  if (account == null) {
    createAccount(accountID)
  }

  if (cTokenStats.storedBorrowBalance.equals(ZERO_BD)) {
    market.numberOfBorrowers = market.numberOfBorrowers - 1
    market.save()

    // todo - volume verify - borrow
    let comptrollerDayData = updateComptrollerDayData(event)
    let marketHourData = updateMarketHourData(event)
    let marketDayData = updateMarketDayData(event)

    let volume = getVolumePrice(event.params.repayAmount, market)
    let volumeUSD = getVolumePriceUSD(event.params.repayAmount, market)

    comptrollerDayData.dailyBorrowTxns = comptrollerDayData.dailyBorrowTxns.plus(ONE_BI)
    comptrollerDayData.dailyBorrowVolumeNOTE = comptrollerDayData.dailyBorrowVolumeNOTE.minus(
      volume,
    )
    comptrollerDayData.dailyBorrowVolumeUSD = comptrollerDayData.dailyBorrowVolumeUSD.minus(
      volumeUSD,
    )
    comptrollerDayData.save()

    marketHourData.hourlyBorrowTxns = marketHourData.hourlyBorrowTxns.plus(ONE_BI)
    marketHourData.hourlyBorrowVolumeNOTE = marketHourData.hourlyBorrowVolumeNOTE.minus(
      volume,
    )
    marketHourData.hourlyBorrowVolumeUSD = marketHourData.hourlyBorrowVolumeUSD.minus(
      volumeUSD,
    )
    marketHourData.save()

    marketDayData.dailyBorrowTxns = marketDayData.dailyBorrowTxns.plus(ONE_BI)
    marketDayData.dailyBorrowVolumeNOTE = marketDayData.dailyBorrowVolumeNOTE.minus(
      volume,
    )
    marketDayData.dailyBorrowVolumeUSD = marketDayData.dailyBorrowVolumeUSD.minus(
      volumeUSD,
    )
    marketDayData.save()
  }
}

/*
 * Liquidate an account who has fell below the collateral factor.
 *
 * event.params.borrower - the borrower who is getting liquidated of their cTokens
 * event.params.cTokenCollateral - the market ADDRESS of the ctoken being liquidated
 * event.params.liquidator - the liquidator
 * event.params.repayAmount - the amount of underlying to be repaid
 * event.params.seizeTokens - cTokens seized (transfer event should handle this)
 *
 * Notes
 *    No need to updateMarket(), handleAccrueInterest() ALWAYS runs before this.
 *    When calling this function, event RepayBorrow, and event Transfer will be called every
 *    time. This means we can ignore repayAmount. Seize tokens only changes state
 *    of the cTokens, which is covered by transfer. Therefore we only
 *    add liquidation counts in this handler.
 */
export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  let liquidatorID = event.params.liquidator.toHex()
  let liquidator = Account.load(liquidatorID)
  if (liquidator == null) {
    liquidator = createAccount(liquidatorID)
  }
  liquidator.countLiquidator = liquidator.countLiquidator + 1
  liquidator.save()

  let borrowerID = event.params.borrower.toHex()
  let borrower = Account.load(borrowerID)
  if (borrower == null) {
    borrower = createAccount(borrowerID)
  }
  borrower.countLiquidated = borrower.countLiquidated + 1
  borrower.save()
}

/* Transferring of cTokens
 *
 * event.params.from = sender of cTokens
 * event.params.to = receiver of cTokens
 * event.params.amount = amount sent
 *
 * Notes
 *    Possible ways to emit Transfer:
 *      seize() - i.e. a Liquidation Transfer (does not emit anything else)
 *      redeemFresh() - i.e. redeeming your cTokens for underlying asset
 *      mintFresh() - i.e. you are lending underlying assets to create ctokens
 *      transfer() - i.e. a basic transfer
 *    This function handles all 4 cases. Transfer is emitted alongside the mint, redeem, and seize
 *    events. So for those events, we do not update cToken balances.
 */
export function handleTransfer(event: Transfer): void {
  // We only updateMarket() if accrual block number is not up to date. This will only happen
  // with normal transfers, since mint, redeem, and seize transfers will already run updateMarket()
  let marketId = event.address.toHex()
  let market = Market.load(marketId)
  if (market == null) {
    market = createMarket(marketId)
  }

  if (market.accrualBlockNumber != event.block.number.toI32()) {
    market = updateMarket(
      event,
      event.address,
      event.block.number.toI32(),
      event.block.timestamp.toI32(),
    )
    if (market == null) {
      return
    }
  }

  let amountUnderlying = market.exchangeRate.times(
    event.params.amount.toBigDecimal().div(cTOKEN_DECIMALS_BD),
  )
  let amountUnderylingTruncated = amountUnderlying.truncate(market.underlyingDecimals)

  let accountFromID = event.params.from.toHex()

  // Checking if the tx is FROM the cToken contract (i.e. this will not run when minting)
  // If so, it is a mint, and we don't need to run these calculations
  if (accountFromID != marketId) {
    let accountFrom = Account.load(accountFromID)
    if (accountFrom == null) {
      createAccount(accountFromID)
    }

    // Update cTokenStats common for all events, and return the stats to update unique
    // values for each event
    let cTokenStatsFrom = updateCommonCTokenStats(
      market.id,
      market.symbol,
      accountFromID,
      event.transaction.hash,
      event.block.timestamp.toI32(),
      event.block.number.toI32(),
    )

    cTokenStatsFrom.cTokenBalance = cTokenStatsFrom.cTokenBalance.minus(
      event.params.amount
        .toBigDecimal()
        .div(cTOKEN_DECIMALS_BD)
        .truncate(cTOKEN_DECIMALS),
    )

    cTokenStatsFrom.totalUnderlyingRedeemed = cTokenStatsFrom.totalUnderlyingRedeemed.plus(
      amountUnderylingTruncated,
    )
    cTokenStatsFrom.save()

    if (cTokenStatsFrom.cTokenBalance.equals(ZERO_BD)) {
      market.numberOfSuppliers = market.numberOfSuppliers - 1
      market.save()
    }
  }

  let accountToID = event.params.to.toHex()
  // Checking if the tx is TO the cToken contract (i.e. this will not run when redeeming)
  // If so, we ignore it. this leaves an edge case, where someone who accidentally sends
  // cTokens to a cToken contract, where it will not get recorded. Right now it would
  // be messy to include, so we are leaving it out for now TODO fix this in future
  if (accountToID != marketId) {
    let accountTo = Account.load(accountToID)
    if (accountTo == null) {
      createAccount(accountToID)
    }

    // Update cTokenStats common for all events, and return the stats to update unique
    // values for each event
    let cTokenStatsTo = updateCommonCTokenStats(
      market.id,
      market.symbol,
      accountToID,
      event.transaction.hash,
      event.block.timestamp.toI32(),
      event.block.number.toI32(),
    )

    let previousCTokenBalanceTo = cTokenStatsTo.cTokenBalance
    cTokenStatsTo.cTokenBalance = cTokenStatsTo.cTokenBalance.plus(
      event.params.amount
        .toBigDecimal()
        .div(cTOKEN_DECIMALS_BD)
        .truncate(cTOKEN_DECIMALS),
    )

    cTokenStatsTo.totalUnderlyingSupplied = cTokenStatsTo.totalUnderlyingSupplied.plus(
      amountUnderylingTruncated,
    )
    cTokenStatsTo.save()

    if (
      previousCTokenBalanceTo.equals(ZERO_BD) &&
      !event.params.amount.toBigDecimal().equals(ZERO_BD) // checking edge case for transfers of 0
    ) {
      market.numberOfSuppliers = market.numberOfSuppliers + 1
      market.save()
    }

    // todo - volume verify - supply
    if (event.params.from.toHex() == event.address.toHex()) {
      let comptrollerDayData = updateComptrollerDayData(event)
      let marketHourData = updateMarketHourData(event)
      let marketDayData = updateMarketDayData(event)

      let volume = getVolumePrice(event.params.amount, market as Market)
      let volumeUSD = getVolumePriceUSD(event.params.amount, market as Market)

      comptrollerDayData.dailySupplyTxns = comptrollerDayData.dailySupplyTxns.plus(ONE_BI)
      comptrollerDayData.dailySupplyVolumeNOTE = comptrollerDayData.dailySupplyVolumeNOTE.plus(
        volume,
      )
      comptrollerDayData.dailySupplyVolumeUSD = comptrollerDayData.dailySupplyVolumeUSD.plus(
        volumeUSD,
      )
      comptrollerDayData.save()

      marketHourData.hourlySupplyTxns = marketHourData.hourlySupplyTxns.plus(ONE_BI)
      marketHourData.hourlySupplyVolumeNOTE = marketHourData.hourlySupplyVolumeNOTE.plus(
        volume,
      )
      marketHourData.hourlySupplyVolumeUSD = marketHourData.hourlySupplyVolumeUSD.plus(
        volumeUSD,
      )
      marketHourData.save()

      marketDayData.dailySupplyTxns = marketDayData.dailySupplyTxns.plus(ONE_BI)
      marketDayData.dailySupplyVolumeNOTE = marketDayData.dailySupplyVolumeNOTE.plus(
        volume,
      )
      marketDayData.dailySupplyVolumeUSD = marketDayData.dailySupplyVolumeUSD.plus(
        volumeUSD,
      )
      marketDayData.save()
    } else if (event.params.to.toHex() == event.address.toHex()) {
      let comptrollerDayData = updateComptrollerDayData(event)
      let marketHourData = updateMarketHourData(event)
      let marketDayData = updateMarketDayData(event)

      let volume = getVolumePrice(event.params.amount, market as Market)
      let volumeUSD = getVolumePriceUSD(event.params.amount, market as Market)

      comptrollerDayData.dailySupplyTxns = comptrollerDayData.dailySupplyTxns.plus(ONE_BI)
      comptrollerDayData.dailySupplyVolumeNOTE = comptrollerDayData.dailySupplyVolumeNOTE.minus(
        volume,
      )
      comptrollerDayData.dailySupplyVolumeUSD = comptrollerDayData.dailySupplyVolumeUSD.minus(
        volumeUSD,
      )
      comptrollerDayData.save()

      marketHourData.hourlySupplyTxns = marketHourData.hourlySupplyTxns.plus(ONE_BI)
      marketHourData.hourlySupplyVolumeNOTE = marketHourData.hourlySupplyVolumeNOTE.minus(
        volume,
      )
      marketHourData.hourlySupplyVolumeUSD = marketHourData.hourlySupplyVolumeUSD.minus(
        volumeUSD,
      )
      marketHourData.save()

      marketDayData.dailySupplyTxns = marketDayData.dailySupplyTxns.plus(ONE_BI)
      marketDayData.dailySupplyVolumeNOTE = marketDayData.dailySupplyVolumeNOTE.minus(
        volume,
      )
      marketDayData.dailySupplyVolumeUSD = marketDayData.dailySupplyVolumeUSD.minus(
        volumeUSD,
      )
      marketDayData.save()
    }
  }
}

export function handleAccrueInterest(event: AccrueInterest): void {
  let market = updateMarket(
    event,
    event.address,
    event.block.number.toI32(),
    event.block.timestamp.toI32(),
  ) as Market

  if (market == null) {
    return
  }

  // todo - volume verify - borrow
  let comptrollerDayData = updateComptrollerDayData(event)
  let marketHourData = updateMarketHourData(event)
  let marketDayData = updateMarketDayData(event)

  let volume = getVolumePrice(event.params.interestAccumulated, market)
  let volumeUSD = getVolumePriceUSD(event.params.interestAccumulated, market)

  comptrollerDayData.dailySupplyTxns = comptrollerDayData.dailySupplyTxns.plus(ONE_BI)
  comptrollerDayData.dailyBorrowVolumeNOTE = comptrollerDayData.dailyBorrowVolumeNOTE.plus(
    volume,
  )
  comptrollerDayData.dailyBorrowVolumeUSD = comptrollerDayData.dailyBorrowVolumeUSD.plus(
    volumeUSD,
  )
  comptrollerDayData.save()

  marketHourData.hourlySupplyTxns = marketHourData.hourlySupplyTxns.plus(ONE_BI)
  marketHourData.hourlyBorrowVolumeNOTE = marketHourData.hourlyBorrowVolumeNOTE.plus(
    volume,
  )
  marketHourData.hourlyBorrowVolumeUSD = marketHourData.hourlyBorrowVolumeUSD.plus(
    volumeUSD,
  )
  marketHourData.save()

  marketDayData.dailySupplyTxns = marketDayData.dailySupplyTxns.plus(ONE_BI)
  marketDayData.dailyBorrowVolumeNOTE = marketDayData.dailyBorrowVolumeNOTE.plus(volume)
  marketDayData.dailyBorrowVolumeUSD = marketDayData.dailyBorrowVolumeUSD.plus(volumeUSD)
  marketDayData.save()
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  let marketId = event.address.toHex()
  let market = Market.load(marketId)
  if (market == null) {
    market = createMarket(marketId)
  }
  market.reserveFactor = event.params.newReserveFactorMantissa
  market.save()
}

export function handleNewMarketInterestRateModel(
  event: NewMarketInterestRateModel,
): void {
  let marketId = event.address.toHex()
  let market = Market.load(marketId)
  if (market == null) {
    market = createMarket(marketId)
  }
  market.interestRateModelAddress = event.params.newInterestRateModel
  market.save()
}
