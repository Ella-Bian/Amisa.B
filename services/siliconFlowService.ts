interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
      reasoning_content?: string;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
  model: string;
  object: string;
}

interface ImageGenerationResponse {
  images: Array<{
    url: string;
  }>;
  timings?: {
    inference: number;
  };
  seed?: number;
}

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
  },

  /**
   * Creates a chat completion using SiliconFlow API.
   * Model: deepseek-ai/DeepSeek-V3
   */
  async chatCompletion(
    messages: ChatMessage[],
    token: string,
    systemInstruction?: string
  ): Promise<string> {
    console.log('[siliconFlowService] chatCompletion called', { 
      messageCount: messages.length, 
      hasSystemInstruction: !!systemInstruction,
      hasToken: !!token 
    });
    
    if (!token) {
      console.error('[siliconFlowService] Token is missing');
      throw new Error("SiliconFlow API Token is missing. Please check settings.");
    }

    const requestMessages: ChatMessage[] = [];
    
    // Add system instruction if provided
    if (systemInstruction) {
      requestMessages.push({
        role: 'system',
        content: systemInstruction
      });
    }
    
    // Add conversation messages
    requestMessages.push(...messages);

    try {
      console.log('[siliconFlowService] Sending request to SiliconFlow API...');
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-V3',
          messages: requestMessages,
        }),
      });

      console.log('[siliconFlowService] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[siliconFlowService] API error:', response.status, errorText);
        throw new Error(`Chat completion failed: ${response.status} ${errorText}`);
      }

      const data: ChatCompletionResponse = await response.json();
      console.log('[siliconFlowService] API response received, choices:', data.choices?.length || 0);
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message.content) {
        const content = data.choices[0].message.content;
        console.log('[siliconFlowService] Returning content, length:', content.length);
        return content;
      }
      
      console.error('[siliconFlowService] No content in response');
      throw new Error("No content in response");
    } catch (error) {
      console.error("[siliconFlowService] Chat Completion Error:", error);
      throw error;
    }
  },

  /**
   * Creates a streaming chat completion using SiliconFlow API.
   * Model: deepseek-ai/DeepSeek-V3
   */
  async *chatCompletionStream(
    messages: ChatMessage[],
    token: string,
    systemInstruction?: string
  ): AsyncGenerator<string, void, unknown> {
    if (!token) {
      throw new Error("SiliconFlow API Token is missing. Please check settings.");
    }

    const requestMessages: ChatMessage[] = [];
    
    // Add system instruction if provided
    if (systemInstruction) {
      requestMessages.push({
        role: 'system',
        content: systemInstruction
      });
    }
    
    // Add conversation messages
    requestMessages.push(...messages);

    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-V3',
          messages: requestMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat completion failed: ${response.status} ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                yield delta;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("SiliconFlow Chat Completion Stream Error:", error);
      throw error;
    }
  },

  /**
   * Generates an image using SiliconFlow API.
   * API Documentation: https://docs.siliconflow.cn/cn/api-reference/images/images-generations
   * Model: Qwen/Qwen-Image-Edit-2509 (default)
   * 
   * Note: Qwen/Qwen-Image-Edit-2509 and Qwen/Qwen-Image-Edit do not support image_size field.
   * The generated image URL is valid for one hour. Please download and store it promptly.
   */
  async generateImage(
    prompt: string, 
    token: string, 
    options?: {
      model?: string;
      negative_prompt?: string;
      seed?: number;
      num_inference_steps?: number;
      cfg?: number;
      image?: string; // base64 or URL for image editing
      image2?: string; // base64 or URL (only for Qwen/Qwen-Image-Edit-2509)
      image3?: string; // base64 or URL (only for Qwen/Qwen-Image-Edit-2509)
    }
  ): Promise<string> {
    console.log('[siliconFlowService] generateImage called');
    
    if (!token) {
      console.error('[siliconFlowService] Token is missing');
      throw new Error("SiliconFlow API Token is missing. Please check settings.");
    }

    // 默认使用 Qwen/Qwen-Image-Edit-2509 模型
    const imageModel = options?.model || 'Qwen/Qwen-Image-Edit-2509';

    try {
      console.log('[siliconFlowService] Sending image generation request...', { model: imageModel });
      
      // 构建请求体，根据新 API 文档格式
      const requestBody: any = {
        model: imageModel,
        prompt: prompt,
      };

      // 添加可选参数
      if (options?.negative_prompt) {
        requestBody.negative_prompt = options.negative_prompt;
      }
      if (options?.seed !== undefined) {
        requestBody.seed = options.seed;
      }
      if (options?.num_inference_steps !== undefined) {
        requestBody.num_inference_steps = options.num_inference_steps;
      }
      if (options?.cfg !== undefined) {
        requestBody.cfg = options.cfg;
      }
      if (options?.image) {
        requestBody.image = options.image;
      }
      if (options?.image2) {
        requestBody.image2 = options.image2;
      }
      if (options?.image3) {
        requestBody.image3 = options.image3;
      }

      const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[siliconFlowService] Image generation response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[siliconFlowService] Image generation error:', response.status, errorText);
        throw new Error(`Image generation failed: ${response.status} ${errorText}`);
      }

      const data: ImageGenerationResponse = await response.json();
      console.log('[siliconFlowService] Image generated successfully');
      
      // 根据新 API 文档，响应结构是 data.images[0].url
      // 生成的图片 URL 有效期为 1 小时，需要及时下载保存
      if (data.images && data.images.length > 0 && data.images[0].url) {
        const imageUrl = data.images[0].url;
        console.log('[siliconFlowService] Image URL:', imageUrl);
        return imageUrl;
      }
      
      throw new Error("No image URL in response");
    } catch (error) {
      console.error("[siliconFlowService] Image Generation Error:", error);
      throw error;
    }
  },
};