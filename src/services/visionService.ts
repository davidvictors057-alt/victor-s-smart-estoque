export interface Detection {
  bbox: [number, number, number, number];
  class: string;
  confidence: number;
}

export interface AuditResult {
  status: string;
  count: number;
  detections: Detection[];
}

class VisionService {
  private get baseUrl() {
    const hostname = window.location.hostname;
    // Se estiver acessando via IP (ex: 192.168...), usa o mesmo IP na porta 8000
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:8000`;
    }
    return "http://localhost:8000";
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async auditFrame(imageBlob: Blob): Promise<AuditResult | null> {
    try {
      const formData = new FormData();
      formData.append("file", imageBlob, "frame.jpg");

      const response = await fetch(`${this.baseUrl}/audit`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Falha no Core de Visão");
      return await response.json();
    } catch (error) {
      console.error("Vision Audit Error:", error);
      return null;
    }
  }
}

export const visionService = new VisionService();
