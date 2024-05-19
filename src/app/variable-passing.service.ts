import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VariablePassingService {
  private tickerSource = new BehaviorSubject<string>('');
  currentTicker = this.tickerSource.asObservable();

  private invalidTicker = new BehaviorSubject<boolean>(false);
  tickerValidity = this.invalidTicker.asObservable();

  private blankTicker = new BehaviorSubject<boolean>(false);
  tickerBlank = this.blankTicker.asObservable();

  private validData = new BehaviorSubject<boolean>(false);
  dataValid = this.validData.asObservable();

  private firstRender = new BehaviorSubject<boolean>(false);
  intialRender = this.firstRender.asObservable();

  private resetSubject = new Subject<void>();
  resetObservable$ = this.resetSubject.asObservable();

  private newsdata = new BehaviorSubject<any>(null);
  newsdatapasser = this.newsdata.asObservable();

  constructor() { }

  changeTicker(ticker: string) {
    this.tickerSource.next(ticker)
  }

  getCurrentTicker() {
    return this.currentTicker
  }

  changeTickerValidity(flag: boolean) {
    this.invalidTicker.next(flag)
  }

  changeBlankTicker(flag: boolean) {
    this.blankTicker.next(flag)
  }

  passNewsData(data: any) {
    this.newsdata.next(data)
  }

  changeDataValidity(flag: boolean) {
    this.validData.next(flag)
  }

  changeRenderStatus(flag: boolean) {
    this.firstRender.next(flag)
  }

  checkRenderStatus() {
    return this.firstRender.getValue()
  }

  triggerReset() {
    this.resetSubject.next();
  }
}
