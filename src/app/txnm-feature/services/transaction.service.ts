import { Injectable } from '@angular/core';
import { Observable, interval, timer } from 'rxjs';
import { map, catchError, switchMap, filter, take, timeout, tap, startWith } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Transaction, ApiResponse, BankConfig, SpendingInsights, AnalysisStatus, AnalysisProgress, AnalysisRequest, AnalysisError, KafkaAnalysisResponse } from '../models/api-response.model';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private sessionId: string | null = null;
  private readonly bankConfigs: { [key: string]: BankConfig } = {
    'HDFC': {
      name: 'HDFC Bank',
      keyFormat: '^[A-Z]{4}[0-9]{7}$',
      keyHint: 'Format: ABCD1234567 (4 letters + 7 digits)',
      keyPlaceholder: 'Enter your HDFC statement key'
    },
    'ICICI': {
      name: 'ICICI Bank',
      keyFormat: '^[0-9]{10}$',
      keyHint: 'Format: 10 digits',
      keyPlaceholder: 'Enter your ICICI account number'
    },
    'SBI': {
      name: 'State Bank of India',
      keyFormat: '^[0-9]{11}$',
      keyHint: 'Format: 11 digits',
      keyPlaceholder: 'Enter your SBI account number'
    },
    'AXIS': {
      name: 'Axis Bank',
      keyFormat: '^[0-9]{12}$',
      keyHint: 'Format: 12 digits',
      keyPlaceholder: 'Enter your Axis account number'
    }
  };

  constructor(
    private baseApi: BaseApiService,
    private sessionService: SessionService
  ) {  }

  private getSessionId(): string | null {
    return this.sessionService.getSessionId();
  }

  getBankConfigs(): { [key: string]: BankConfig } {
    return this.bankConfigs;
  }

  validateBankKey(bankCode: string, key: string): boolean {
    const config = this.bankConfigs[bankCode];
    if (!config) return false;
    
    const regex = new RegExp(config.keyFormat);
    return regex.test(key);
  }

  parseTransactions(file: File, password: string, bankCode: string): Observable<Transaction[]> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    
    // Send bank code in lowercase as expected by backend
    formData.append('bankName', bankCode.toLowerCase());
    
    const sessionId = this.getSessionId();
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    console.log('Uploading file:', file.name);
    console.log('Password:', password);
    console.log('Bank Code:', bankCode);
    console.log('Bank Name (sent to backend):', bankCode.toLowerCase());
    console.log('Session ID:', sessionId);

    // Wired to txnm-mvp's hardcoded test controller for now (gateway/module smoke test) -
    // switch back to '/transactions/parse' once testing the real parsing flow.
    return this.baseApi.postFormData<Transaction[]>('/test/transactions/upload', formData).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('Transactions parsed successfully:', response.data.length);
          return response.data;
        }
        throw new Error(response.message || 'Failed to parse transactions');
      }),
      catchError(error => {
        console.error('Transaction parsing error:', error);
        throw error;
      })
    );
  }

  getTransactions(): Observable<Transaction[]> {
    const sessionId = this.getSessionId();
    if (!sessionId) {
      throw new Error('No active session');
    }

    return this.baseApi.get<Transaction[]>(`/test/transactions?sessionId=${sessionId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch transactions');
      }),
      catchError(error => {
        console.error('Error fetching transactions:', error);
        throw error;
      })
    );
  }

  getTransactionAnalytics(period: 'daily' | 'weekly' | 'five-day'): Observable<any> {
    const sessionId = this.getSessionId();
    if (!sessionId) {
      throw new Error('No active session');
    }

    return this.baseApi.get<any>(`/test/transactions/analytics/${period}?sessionId=${sessionId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch analytics');
      }),
      catchError(error => {
        console.error('Error fetching analytics:', error);
        throw error;
      })
    );
  }

  getAISpendingInsights(): Observable<SpendingInsights> {
    const sessionId = this.getSessionId();
    if (!sessionId) {
      throw new Error('No active session');
    }

    console.log('Requesting AI spending insights for session:', sessionId);

    return this.baseApi.post<SpendingInsights>(`/txnm/ai/analyze-spending?sessionId=${sessionId}`, {}).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('AI insights received successfully:', response.data);
          return response.data;
        }
        throw new Error(response.message || 'Failed to get AI insights');
      }),
      catchError(error => {
        console.error('Error fetching AI insights:', error);
        throw error;
      })
    );
  }

  // ===== NEW ASYNC KAFKA-BASED METHODS =====

  /**
   * Send AI analysis request via Kafka (async processing)
   * Returns requestId for tracking
   */
  sendAIAnalysisRequest(sessionId?: string): Observable<{requestId: string, status: string, sessionId: string}> {
    const targetSessionId = sessionId || this.getSessionId();
    if (!targetSessionId) {
      throw new Error('No active session');
    }

    console.log('Sending async AI analysis request for session:', targetSessionId);

    return this.baseApi.post<{requestId: string, status: string, sessionId: string}>(
      `/kafka/ai/analyze?sessionId=${targetSessionId}`, 
      {}
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('AI analysis request sent successfully:', response.data);
          return response.data;
        }
        throw new Error(response.message || 'Failed to send AI analysis request');
      }),
      catchError(error => {
        console.error('Error sending AI analysis request:', error);
        throw error;
      })
    );
  }

  /**
   * Check analysis status for a given requestId
   */
  checkAnalysisStatus(requestId: string): Observable<AnalysisStatus> {
    console.log('Checking analysis status for request:', requestId);

    return this.baseApi.get<AnalysisStatus>(`/kafka/ai/status/${requestId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('Analysis status received:', response.data);
          return response.data;
        }
        throw new Error(response.message || 'Failed to get analysis status');
      }),
      catchError(error => {
        console.error('Error checking analysis status:', error);
        throw error;
      })
    );
  }

  /**
   * Get completed analysis results for a session
   */
  getAnalysisResults(sessionId?: string): Observable<SpendingInsights> {
    const targetSessionId = sessionId || this.getSessionId();
    if (!targetSessionId) {
      throw new Error('No active session');
    }

    console.log('Retrieving analysis results for session:', targetSessionId);

    return this.baseApi.get<SpendingInsights>(`/kafka/ai/results/${targetSessionId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('Analysis results retrieved successfully:', response.data);
          return response.data;
        }
        throw new Error(response.message || 'Failed to get analysis results');
      }),
      catchError(error => {
        console.error('Error retrieving analysis results:', error);
        throw error;
      })
    );
  }

  /**
   * Get analysis progress for a session
   */
  getAnalysisProgress(sessionId?: string): Observable<AnalysisProgress> {
    const targetSessionId = sessionId || this.getSessionId();
    if (!targetSessionId) {
      throw new Error('No active session');
    }

    console.log('Retrieving analysis progress for session:', targetSessionId);

    return this.baseApi.get<AnalysisProgress>(`/kafka/ai/progress/${targetSessionId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('Analysis progress received:', response.data);
          return response.data;
        }
        throw new Error(response.message || 'Failed to get analysis progress');
      }),
      catchError(error => {
        console.error('Error retrieving analysis progress:', error);
        throw error;
      })
    );
  }

  /**
   * Get all insights asynchronously with automatic polling
   * This is the main method that handles the complete async flow
   */
  getAllInsightsAsync(sessionId?: string): Observable<SpendingInsights> {
    const targetSessionId = sessionId || this.getSessionId();
    if (!targetSessionId) {
      throw new Error('No active session');
    }

    console.log('Starting async AI analysis for session:', targetSessionId);

    // Step 1: Send analysis request
    return this.sendAIAnalysisRequest(targetSessionId).pipe(
      switchMap(initResponse => {
        const requestId = initResponse.requestId;
        console.log('Analysis request initiated with ID:', requestId);
        
        // Step 2: Poll until completion
        return this.pollUntilComplete(requestId);
      })
    );
  }

  /**
   * Poll for analysis completion with intelligent intervals
   */
  private pollUntilComplete(requestId: string): Observable<SpendingInsights> {
    console.log('Starting polling for request:', requestId);

    return interval(2000).pipe( // Poll every 2 seconds
      startWith(0), // Start immediately
      switchMap(() => this.checkAnalysisStatus(requestId)),
      tap(status => {
        console.log('Polling status:', status.status, 
          status.status === 'PROCESSING' ? `(${status.chunksProcessed}/${status.totalChunks})` : '');
      }),
      filter(status => status.status === 'COMPLETED'),
      take(1), // Take first completion
      switchMap(status => {
        if (status.insights) {
          return [status.insights];
        } else {
          // If insights not in status response, fetch separately
          return this.getAnalysisResults(status.sessionId);
        }
      }),
      timeout(300000), // 5 minute timeout
      catchError(error => {
        console.error('Error during polling:', error);
        throw error;
      })
    );
  }

  /**
   * Check if session has completed analysis
   */
  hasCompletedAnalysis(sessionId?: string): Observable<boolean> {
    const targetSessionId = sessionId || this.getSessionId();
    if (!targetSessionId) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    return this.getAnalysisResults(targetSessionId).pipe(
      map(() => true),
      catchError(() => {
        return new Observable<boolean>(observer => {
          observer.next(false);
          observer.complete();
        });
      })
    );
  }
}
