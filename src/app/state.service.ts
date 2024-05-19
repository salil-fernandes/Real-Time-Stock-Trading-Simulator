import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  public dataStore = new Map<string, any[]>();

  public setData(key: string, data: any[]): void {
    this.clearStore()
    this.dataStore.set(key, data);
  }

  public getData(key: string): any {
    return this.dataStore.get(key);
  }

  public hasData(key: string): boolean {
    return this.dataStore.has(key);
  }

  public clearStore() {
    this.dataStore.clear()
  }
}
