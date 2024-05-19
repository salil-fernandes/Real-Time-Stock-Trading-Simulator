import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  //baseURL = 'http://127.0.0.1:8080'
  constructor(private http: HttpClient) { }

  fetchBalance(): Observable<any[]> {
    //const getBalanceURL = `${this.baseURL}/retrieve-balance`
    const getBalanceURL = `/retrieve-balance`
        return this.http.get<any[]>(getBalanceURL).pipe(
          map(data => data)
        )
  }

  modifyWallet(newBalance: any): Observable<any[]> {
    //const modifyWatchlistURL = `${this.baseURL}/update-balance` + `/${newBalance}`
    const modifyWatchlistURL = `/update-balance` + `/${newBalance}`
    return this.http.put<any[]>(modifyWatchlistURL, {})
  }

  fetchWatchlist(): Observable<any[]> {
    const getWatchlistURL = `/retrieve-watchlist`
        return this.http.get<any[]>(getWatchlistURL).pipe(
          map(data => data)
        )
  }

  modifyWatchlist(operation: string, ticker: string): Observable<any[]> {
    const modifyWatchlistURL = `/update-watchlist` + `/${operation}/${ticker}`
    return this.http.put<any[]>(modifyWatchlistURL, {})
  }

  fetchCompletePortfolio(): Observable<any[]> {
    const completePortfolioURL = `/retrieve-whole-portfolio`
        return this.http.get<any[]>(completePortfolioURL).pipe(
          map(data => data)
        )
  }

  fetchCurrentPortfolio(): Observable<any[]> {
    const currentPortfolioURL = `/retrieve-portfolio`
        return this.http.get<any[]>(currentPortfolioURL).pipe(
          map(data => data)
        )
  }

  fetchStockPortfolio(ticker: string): Observable<any[]> {
    const stockPortfolioURL = `/retrieve-stock-portfolio/` + ticker
        return this.http.get<any[]>(stockPortfolioURL).pipe(
          map(data => data)
        )
  }

  modifyPortfolio(operation: string, ticker: string): Observable<any[]> {
    const modifyPortfolioURL = `/update-portfolio` + `/${operation}/${ticker}`
    return this.http.put<any[]>(modifyPortfolioURL, {})
  }

  firstPortfolioBuy(payload: any) {
    const firstBuyURL = `/portfolio-buy-firsttime`
    return this.http.post(firstBuyURL, payload);
  }

  mainPortfolioBuy(ticker: string, payload: any) {
    const buyURL = `/portfolio-buy/` + ticker
    return this.http.put(buyURL, payload)
  }

  sellAllShares(ticker: string) {
    const sellAllURL = `/portfolio-sell-whole-stock/` + ticker
    return this.http.delete(sellAllURL)
  }

  mainPortfolioSell(ticker: string, payload: any) {
    const buyURL = `/portfolio-sell/` + ticker
    return this.http.put(buyURL, payload)
  }
}
