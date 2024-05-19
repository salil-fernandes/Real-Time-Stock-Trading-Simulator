import { Injectable, OnDestroy } from '@angular/core';
import { interval, Observable, Subject, Subscription } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';
import { APIService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class IntervalService implements OnDestroy {
  private intervalSubscription: Subscription;
  private stop$ = new Subject<void>();
  private currentSymbol: string;

  constructor(private apiService: APIService) {}

  startInterval(symbol: string, milliseconds: number): Observable<any> {
    this.currentSymbol = symbol;

    // Clear any existing interval before starting a new one
    this.stopInterval();

    // Create an observable that emits at the given interval
    return interval(milliseconds).pipe(
      startWith(0), // Optionally start immediately
      takeUntil(this.stop$), // Automatically unsubscribe when stop$ emits
      switchMap(() => this.apiService.fetchCompanyLatest(symbol)) // Replace with your data fetching logic
    );
  }

  stopInterval(): void {
    this.stop$.next();
  }

  private fetchData(symbol: string): Observable<any> {
    // Implement the logic to fetch data based on the symbol
    // This example assumes you have a method to fetch data that returns an Observable
    console.log(`Fetching data for ${symbol}`);
    return this.apiService.fetchCompanyLatest(symbol); // Example API call
  }

  ngOnDestroy(): void {
    this.stopInterval();
  }
}