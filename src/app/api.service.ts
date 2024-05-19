import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { VariablePassingService } from "./variable-passing.service";

@Injectable({
    providedIn: 'root'
})
export class APIService {
    //baseURL = 'http://127.0.0.1:8080'
    constructor(private http: HttpClient, private variablePassingService: VariablePassingService) {}

    fetchAutocompleteData(keyword: string): Observable<any[]> {
        //const autoURL = `${this.baseURL}/autocomplete/${keyword}`
        const autoURL = `/autocomplete/${keyword}`
        return this.http.get<any[]>(autoURL).pipe(
          map(data => data)
        )
    }

    fetchCompanyProfile(ticker: string): Observable<any[]> {
      //const profileURL = `${this.baseURL}/company-profile/${ticker}`
      const profileURL = `/company-profile/${ticker}`
      return this.http.get<any[]>(profileURL).pipe(
        map(data => data)
      )
  }

  fetchCompanyLatest(ticker: string): Observable<any[]> {
    const latestURL = `/company-latest/${ticker}`
    return this.http.get<any[]>(latestURL).pipe(
      map(data => {

        var currentTimestamp = Date.now()

        if(data['d'] != null) {
          data['c'] = Number(data['c']).toFixed(2)
          data['d'] = Number(data['d']).toFixed(2)
          data['dp'] = Number(data['dp']).toFixed(2)
          data['h'] = Number(data['h']).toFixed(2)
          data['l'] = Number(data['l']).toFixed(2)
          data['o'] = Number(data['o']).toFixed(2)
          data['pc'] = Number(data['pc']).toFixed(2)
        }

        if(data['t'] != null && data['t'] != 0) {
          var apiTimestamp = parseInt(data['t']) * 1000;
          data['difference'] = (currentTimestamp - apiTimestamp);
          if(data['difference'] < 300000) {
            data['isMarketOpen'] = true
          } else {
            data['isMarketOpen'] = false
          }
        }
        return data
      })
    )
  }

  fetchCompanyHourlyChart(ticker: string): Observable<any[]> {
    const hourlyURL = `/company-hourly-chart/${ticker}`
    return this.http.get<any[]>(hourlyURL).pipe(
      map(data => data)
    )
  }

  fetchCompanyPeers(ticker: string): Observable<any[]> {
    const peersURL = `/company-peers/${ticker}`
    return this.http.get<any[]>(peersURL).pipe(
      map(data => data)
    )
  }

  fetchCompanyNews(ticker: string): Observable<any[]> {
    const newsURL = `/company-news/${ticker}`
    return this.http.get<any[]>(newsURL).pipe(
      map(data => data)
    )
  }

  fetchCompanyChart(ticker: string): Observable<any[]> {
    const chartURL = `/company-chart/${ticker}`
    return this.http.get<any[]>(chartURL).pipe(
      map(data => data)
    )
  }

  fetchCompanyRecommendation(ticker: string): Observable<any[]> {
    const recommendationURL = `/company-recommendation/${ticker}`
    return this.http.get<any[]>(recommendationURL).pipe(
      map(data => data)
    )
  }

  fetchCompanySentiment(ticker: string): Observable<any[]> {
    const sentimentURL = `/company-insider/${ticker}`
    return this.http.get<any[]>(sentimentURL).pipe(
      map(data => data)
    )
  }

  fetchCompanyEarnings(ticker: string): Observable<any[]> {
    const earningsURL = `/company-earnings/${ticker}`
    return this.http.get<any[]>(earningsURL).pipe(
      map(data => data)
    )
  }
}