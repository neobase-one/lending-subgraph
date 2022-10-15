/* eslint-disable prefer-const */ // to satisfy AS compiler

// For each division by 10, add one to exponent to truncate one significant figure
import { BigDecimal, Bytes, log } from '@graphprotocol/graph-ts/index'
import { AccountCToken, Account } from '../types/schema'
import { ZERO_BD } from './consts'

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function powerToBigDecimal(base: BigDecimal, exp: number): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = 0; i < exp; i++) {
    bd = bd.times(base)
  }
  return bd
}

export function createAccountCToken(
  cTokenStatsID: string,
  symbol: string,
  account: string,
  marketID: string,
): AccountCToken {
  log.info('HELPERS::createAccountCToken', [])
  let cTokenStats = new AccountCToken(cTokenStatsID)
  cTokenStats.symbol = symbol
  cTokenStats.market = marketID
  cTokenStats.account = account
  cTokenStats.transactionHashes = []
  cTokenStats.transactionTimes = []
  cTokenStats.accrualBlockNumber = 0
  cTokenStats.cTokenBalance = ZERO_BD
  cTokenStats.totalUnderlyingSupplied = ZERO_BD
  cTokenStats.totalUnderlyingRedeemed = ZERO_BD
  cTokenStats.accountBorrowIndex = ZERO_BD
  cTokenStats.totalUnderlyingBorrowed = ZERO_BD
  cTokenStats.totalUnderlyingRepaid = ZERO_BD
  cTokenStats.storedBorrowBalance = ZERO_BD
  cTokenStats.enteredMarket = false
  log.info('HELPERS::createAccountCToken->COMPLETED', [])
  return cTokenStats
}

export function createAccount(accountID: string): Account {
  let account = new Account(accountID)
  account.countLiquidated = 0
  account.countLiquidator = 0
  account.hasBorrowed = false
  account.save()
  return account
}

export function updateCommonCTokenStats(
  marketID: string,
  marketSymbol: string,
  accountID: string,
  txHash: Bytes,
  timestamp: i32,
  blockNumber: i32,
): AccountCToken {
  log.info('HELPERS::updateCommonCTokenStats {} {}', [marketID, accountID])
  let cTokenStatsID = marketID.concat('-').concat(accountID)
  log.info('HELPERS::updateCommonCTokenStats->-2  {}', [cTokenStatsID])
  let cTokenStats = AccountCToken.load(cTokenStatsID)

  log.info('HELPERS::updateCommonCTokenStats->0', [])
  if (cTokenStats == null) {
    log.info('HELPERS::updateCommonCTokenStats->if', [])
    cTokenStats = createAccountCToken(cTokenStatsID, marketSymbol, accountID, marketID)
  }
  log.info('HELPERS::updateCommonCTokenStats->-1  {}', [cTokenStats.id])

  log.info('HELPERS::updateCommonCTokenStats->1', [])
  let txHashes = cTokenStats.transactionHashes
  txHashes.push(txHash)
  cTokenStats.transactionHashes = txHashes

  log.info('HELPERS::updateCommonCTokenStats->2', [])
  let txTimes = cTokenStats.transactionTimes
  txTimes.push(timestamp)
  cTokenStats.transactionTimes = txTimes

  log.info('HELPERS::updateCommonCTokenStats->3', [])
  cTokenStats.accrualBlockNumber = blockNumber

  log.info('HELPERS::updateCommonCTokenStats->COMPLTED', [])
  return cTokenStats as AccountCToken
}
