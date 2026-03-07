import { GoogleGenAI, Type } from "@google/genai";

export interface SOPData {
  title: string;
  division: string;
  objective: string;
  steps: string[];
}

export interface AIOutput {
  sopText: string;
  mermaidCode: string;
  checklist: string[];
  kpis: string[];
  linkage: string;
}

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MODEL_NAME = "gemini-2.0-flash";

// Mock Fallbacks
const mockGenerateSteps = async (title: string, division: string, objective: string): Promise<string[]> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const steps = [
    `Persiapan dokumen dan peralatan untuk ${title}`,
    `Verifikasi kelengkapan data awal oleh tim ${division}`,
    `Pelaksanaan prosedur utama sesuai standar ${division}`,
    `Pengecekan kualitas hasil kerja (Quality Control)`,
    `Dokumentasi dan pelaporan hasil kegiatan`,
    `Evaluasi dan tindak lanjut jika ditemukan ketidaksesuaian`
  ];
  if (objective.toLowerCase().includes('barang')) {
    return [
      "Terima dokumen pengiriman dari kurir/vendor",
      "Cek fisik barang dan sesuaikan dengan Surat Jalan",
      "Buat Berita Acara Penerimaan Barang (BAPB)",
      "Input data barang masuk ke sistem inventory",
      "Simpan barang di lokasi yang ditentukan (Bin Location)",
      "Laporkan penerimaan ke departemen terkait"
    ];
  }
  return steps;
};

const mockGenerateSOP = async (data: SOPData): Promise<AIOutput> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const stepsList = data.steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
  const sopText = `
# STANDAR OPERASIONAL PROSEDUR (SOP)

**Judul:** ${data.title}
**Divisi:** ${data.division}
**Tujuan:** ${data.objective}

## LANGKAH-LANGKAH PROSEDUR:
${stepsList}

## PENGECUALIAN:
- Jika sistem sedang down, lanjutkan dengan protokol manual.
- Eskalasi diperlukan untuk skenario berisiko tinggi.

## REFERENSI:
- ISO 9001:2015 Klausul 8.5
- Dokumen Kebijakan Internal #42
`.trim();

  const mermaidCode = `
flowchart TD
    A(("Mulai")) --> B
    B["Persiapan dokumen<br>dan peralatan"] --> C
    C{"Apakah data<br>lengkap?"}
    C -- Ya --> D["Verifikasi kelengkapan<br>data awal"]
    C -- Tidak --> B
    D --> E{"Lolos Quality<br>Control?"}
    E -- Ya --> F["Dokumentasi dan<br>pelaporan"]
    E -- Tidak --> D
    F --> G(("Selesai"))
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#f9f,stroke:#333,stroke-width:2px
`.trim();

  const checklist = data.steps.map(step => `[ ] ${step}`);
  const kpis = [
    "Waktu penyelesaian < 30 menit",
    "Tingkat kesalahan nol dalam eksekusi",
    "100% kepatuhan terhadap standar keselamatan"
  ];
  const linkage = `SOP ini terkait dengan Divisi ${data.division === 'Gudang' ? 'Logistik' : 'Gudang'}. Buat SOP ${data.division === 'Gudang' ? 'Logistik' : 'Gudang'} sekarang?`;

  return { sopText, mermaidCode, checklist, kpis, linkage };
};

export const generateSteps = async (title: string, division: string, objective: string): Promise<string[]> => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Gemini API Key is missing. Using mock data.");
    return mockGenerateSteps(title, division, objective);
  }

  try {
    const prompt = `
      Anda adalah konsultan ahli SOP (Standar Operasional Prosedur).
      Buatlah daftar langkah-langkah yang detail dan berurutan untuk sebuah SOP dengan rincian berikut:
      
      Judul: ${title}
      Divisi: ${division}
      Tujuan: ${objective}
      
      Langkah-langkah harus praktis, jelas, dan dapat dilaksanakan.
      Gunakan Bahasa Indonesia yang baku dan profesional.
      Kembalikan HANYA array JSON berisi string, di mana setiap string adalah satu langkah.
      PENTING: JANGAN sertakan nomor urut (1., 2., dst) atau tanda markdown (**) di dalam teks langkah.
      Contoh: ["Siapkan dokumen", "Verifikasi data"]
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const steps = JSON.parse(text);
    // Clean up any accidental numbering or markdown that might have slipped through
    return steps.map((s: string) => s.replace(/^(\d+[\.\)\-]\s*)+/, '').replace(/\*\*/g, '').trim());
  } catch (error) {
    console.error("Gemini API Error in generateSteps:", error);
    return mockGenerateSteps(title, division, objective);
  }
};

export const generateSOP = async (data: SOPData): Promise<AIOutput> => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Gemini API Key is missing. Using mock data.");
    return mockGenerateSOP(data);
  }

  try {
    const prompt = `
      Anda adalah konsultan ahli SOP (Standar Operasional Prosedur).
      Buatlah dokumen SOP yang komprehensif berdasarkan masukan berikut:
      
      Judul: ${data.title}
      Divisi: ${data.division}
      Tujuan: ${data.objective}
      Langkah-langkah: ${JSON.stringify(data.steps)}
      
      Mohon buat output berikut dalam format JSON terstruktur (Gunakan Bahasa Indonesia):
      1. sopText: String format Markdown dari dokumen SOP lengkap. Harus mencakup bagian seperti Judul, Divisi, Tujuan, Langkah-langkah Prosedur (kembangkan langkah yang diberikan dengan lebih detail jika perlu), Pengecualian, dan Referensi.
      2. mermaidCode: String kode flowchart TD Mermaid.js yang valid.
         ATURAN MUTLAK FLOWCHART (STRICT SYNTAX):
         a. HEADER: Wajib mulai dengan 'flowchart TD'.
         b. ID NODE: Gunakan huruf kapital tunggal/ganda tanpa spasi (A, B, C, dst).
         c. LABEL NODE: WAJIB dibungkus tanda kutip ganda. Contoh: A["Teks Label"].
         d. DECISION NODE: Wajib ada minimal 2 node keputusan dengan kurung kurawal {} dan label berkutip. Contoh: B{"Apakah Valid?"}.
         e. WORD WRAP: Gunakan tag <br> di dalam tanda kutip jika teks > 4 kata. Contoh: C["Periksa dokumen<br>kelengkapan"].
         f. DILARANG menggunakan tanda kutip ganda (") di dalam teks label. Gunakan tanda kutip tunggal (') jika perlu.
         g. JANGAN gunakan markdown code block.
      3. checklist: Array string untuk checklist harian berdasarkan SOP ini.
      4. kpis: Array string untuk Key Performance Indicators (KPI) guna mengukur keberhasilan SOP ini.
      5. linkage: String yang menyarankan keterkaitan lintas departemen atau SOP terkait yang sebaiknya dibuat selanjutnya.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sopText: { type: Type.STRING },
            mermaidCode: { type: Type.STRING },
            checklist: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            kpis: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            linkage: { type: Type.STRING }
          },
          required: ["sopText", "mermaidCode", "checklist", "kpis", "linkage"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);
    
    // Sanitize Mermaid code to remove markdown blocks if present
    parsed.mermaidCode = parsed.mermaidCode.replace(/```mermaid/g, '').replace(/```/g, '').trim();
    
    return parsed;

  } catch (error) {
    console.error("Gemini API Error in generateSOP:", error);
    return mockGenerateSOP(data);
  }
};
