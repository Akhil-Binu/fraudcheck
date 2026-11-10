/**
 * FraudCheck REST API Client
 */

export class FraudCheckClient {
  /**
   * @param {object} [options]
   * @param {string} [options.baseUrl] - Base API URL (defaults to production Vercel instance)
   * @param {Record<string, string>} [options.headers] - Additional custom headers
   */
  constructor({ baseUrl = "https://fraudcheck-taupe.vercel.app", headers = {} } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.headers = headers;
  }

  /**
   * Health check
   * @returns {Promise<{ status: string }>}
   */
  async health() {
    const res = await fetch(`${this.baseUrl}/api/health`, {
      method: "GET",
      headers: { Accept: "application/json", ...this.headers }
    });
    if (!res.ok) {
      throw new Error(`Health check failed with HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Get list of preloaded demonstration samples
   * @returns {Promise<Array<{ id: string, name: string, type: string, badge: string, description: string }>>}
   */
  async getSamples() {
    const res = await fetch(`${this.baseUrl}/api/samples`, {
      method: "GET",
      headers: { Accept: "application/json", ...this.headers }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch samples: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Analyze one of the preloaded demo samples
   * @param {string} sampleId
   * @returns {Promise<any>}
   */
  async analyzeSample(sampleId) {
    if (!sampleId) throw new Error("sampleId is required");
    const res = await fetch(`${this.baseUrl}/api/analyze-sample/${encodeURIComponent(sampleId)}`, {
      method: "POST",
      headers: { Accept: "application/json", ...this.headers }
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Sample analysis failed (HTTP ${res.status}): ${errBody}`);
    }
    return res.json();
  }

  /**
   * Upload and analyze a document file (PDF or Image)
   * @param {File|Blob|Buffer|Uint8Array} file
   * @param {string} [filename="invoice.pdf"]
   * @returns {Promise<any>}
   */
  async analyze(file, filename = "invoice.pdf") {
    if (!file) throw new Error("File is required for analysis");

    const formData = new FormData();

    if (typeof File !== "undefined" && file instanceof File) {
      formData.append("file", file);
    } else if (typeof Blob !== "undefined" && file instanceof Blob) {
      formData.append("file", file, filename);
    } else {
      // Node.js Buffer or raw Uint8Array
      const blob = new Blob([file]);
      formData.append("file", blob, filename);
    }

    const res = await fetch(`${this.baseUrl}/api/analyze`, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json", ...this.headers }
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Document analysis failed (HTTP ${res.status}): ${errBody}`);
    }

    return res.json();
  }
}
