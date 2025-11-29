export const siliconFlowService = {
  /**
   * Transcribes audio using SiliconFlow API.
   * Model: TeleAI/TeleSpeechASR
   */
  async transcribeAudio(audioBlob: Blob, token: string): Promise<string> {
    if (!token) {
      throw new Error("SiliconFlow API Token is missing. Please check settings.");
    }

    const formData = new FormData();
    // Create a file from the blob with a specific name and extension to help the API identify format
    const file = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
    
    formData.append('file', file);
    formData.append('model', 'TeleAI/TeleSpeechASR');

    try {
      const response = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.text || "";
    } catch (error) {
      console.error("SiliconFlow Transcription Error:", error);
      throw error;
    }
  }
};