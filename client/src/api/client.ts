import { ReportRecord, PastReportSummary } from '../types';

const API_BASE = '/api';

export const api = {
  async createReport(formData: FormData): Promise<{ reportId: string }> {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async previewData(formData: FormData): Promise<{ previews: any[] }> {
    const res = await fetch(`${API_BASE}/reports/preview`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Preview failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async comparePrompts(formData: FormData): Promise<{ v1: any; v2: any; v3: any; charts: any[] }> {
    const res = await fetch(`${API_BASE}/reports/compare`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Comparison failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async getReportStatus(id: string): Promise<{
    id: string;
    status: 'pending' | 'parsing' | 'analysing' | 'writing' | 'completed' | 'failed';
    progressStep: string;
    errorMessage: string | null;
  }> {
    const res = await fetch(`${API_BASE}/reports/${id}/status`);
    if (!res.ok) {
      throw new Error(`Failed to fetch report status: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getReport(id: string): Promise<ReportRecord> {
    const res = await fetch(`${API_BASE}/reports/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch report: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getAllReports(): Promise<PastReportSummary[]> {
    const res = await fetch(`${API_BASE}/reports`);
    if (!res.ok) {
      throw new Error(`Failed to fetch reports: HTTP ${res.status}`);
    }
    return res.json();
  },

  async deleteReport(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async shareReport(id: string): Promise<{ shareUrl: string; token: string }> {
    const res = await fetch(`${API_BASE}/reports/${id}/share`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Failed to share report: HTTP ${res.status}`);
    }
    return res.json();
  },

  async revokeShare(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/reports/${id}/share`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async getSharedReport(token: string): Promise<ReportRecord> {
    const res = await fetch(`${API_BASE}/shared/${token}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Shared report not found' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  getPdfExportUrl(id: string): string {
    return `${API_BASE}/reports/${id}/export/pdf`;
  },

  getDocxExportUrl(id: string): string {
    return `${API_BASE}/reports/${id}/export/docx`;
  },
};
