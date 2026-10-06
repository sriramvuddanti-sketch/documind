import { AppError } from '../middleware/errorHandler.js';
import { aiExtractionSchema } from '../schemas/documentSchemas.js';

const REQUEST_TIMEOUT_MS = 45_000;
const RETRY_DELAYS_MS = [2_000, 4_000, 8_000];
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const AI_BUSY_MESSAGE = 'AI provider is busy, please try again';

class RetryableAiProviderError extends Error {
  constructor(status, providerMessage) {
    super(providerMessage);
    this.name = 'RetryableAiProviderError';
    this.status = status;
    this.providerMessage = providerMessage;
  }
}

const responseSchema = {
  type: 'OBJECT',
  properties: {
    docType: { type: 'STRING' },
    vendor: { type: 'STRING', nullable: true },
    invoiceNumber: { type: 'STRING', nullable: true },
    date: { type: 'STRING', nullable: true },
    dueDate: { type: 'STRING', nullable: true },
    lineItems: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          description: { type: 'STRING', nullable: true },
          quantity: { type: 'NUMBER', nullable: true },
          unitPrice: { type: 'NUMBER', nullable: true },
          amount: { type: 'NUMBER', nullable: true },
        },
      },
    },
    subtotal: { type: 'NUMBER', nullable: true },
    tax: { type: 'NUMBER', nullable: true },
    total: { type: 'NUMBER', nullable: true },
    currency: { type: 'STRING', nullable: true },
    confidence: { type: 'NUMBER', nullable: true },
  },
};

const getConfiguration = () => {
  const apiKey = process.env.AI_API_KEY?.trim();
  const apiUrl = process.env.AI_API_URL?.trim();
  const model = process.env.AI_MODEL?.trim();
  const fallbackModel = process.env.AI_FALLBACK_MODEL?.trim();

  if (!apiKey || !apiUrl || !model) {
    throw new AppError(
      'AI_API_KEY, AI_API_URL, and AI_MODEL must be configured',
      500,
    );
  }

  return { apiKey, apiUrl, model, fallbackModel };
};

const getGenerateContentUrl = ({ apiKey, apiUrl, model }) => {
  const baseUrl = apiUrl.replace(/\/$/, '');
  const versionedBaseUrl = /\/v1(?:beta)?$/.test(baseUrl)
    ? baseUrl
    : `${baseUrl}/v1beta`;
  const endpoint = baseUrl.includes(':generateContent')
    ? baseUrl
    : `${versionedBaseUrl}/models/${encodeURIComponent(model)}:generateContent`;
  const url = new URL(endpoint);

  url.searchParams.set('key', apiKey);
  return url;
};

const extractionPrompt = `You are a document classification and invoice data extraction service.
Inspect the attached PDF or image and return exactly one raw JSON object.
Do not wrap the JSON in Markdown, code fences, or commentary.

Use this exact shape and these exact keys:
{
  "docType": "invoice | receipt | purchase_order | other | unknown",
  "vendor": "string or null",
  "invoiceNumber": "string or null",
  "date": "YYYY-MM-DD string or null",
  "dueDate": "YYYY-MM-DD string or null",
  "lineItems": [
    {
      "description": "string or null",
      "quantity": "number or null",
      "unitPrice": "number or null",
      "amount": "number or null"
    }
  ],
  "subtotal": "number or null",
  "tax": "number or null",
  "total": "number or null",
  "currency": "ISO currency code string or null",
  "confidence": "number from 0 to 1 or null"
}

Classify the document in docType. Use null for any value that cannot be read.
Use numeric JSON values for quantities and monetary amounts, never formatted strings.
Return no keys other than the keys shown above.`;

const retryPrompt = `${extractionPrompt}

Your previous response was not valid for the required schema. Try again and return only valid JSON that can be parsed directly by JSON.parse().`;

const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

const getGeminiErrorMessage = async (response) => {
  const errorBody = await response.json().catch(() => null);
  return errorBody?.error?.message || response.statusText || 'Unknown Gemini error';
};

const logGeminiError = (status, providerMessage, apiKey) => {
  const safeMessage = String(providerMessage)
    .replaceAll(apiKey, '[REDACTED]')
    .replace(/[\r\n]+/g, ' ');

  console.error(`[Gemini] HTTP ${status}: ${safeMessage}`);
};

const requestGemini = async (file, prompt, configuration, model) => {
  const url = getGenerateContentUrl({ ...configuration, model });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: file.mimetype,
                  data: file.buffer.toString('base64'),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema,
        },
      }),
    });

    if (!response.ok) {
      const providerMessage = await getGeminiErrorMessage(response);
      logGeminiError(response.status, providerMessage, configuration.apiKey);

      if (RETRYABLE_STATUS_CODES.has(response.status)) {
        throw new RetryableAiProviderError(response.status, providerMessage);
      }

      throw new AppError('AI provider rejected the request', 502);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join('');

    if (!text) {
      return '';
    }

    return text;
  } catch (error) {
    if (error instanceof AppError || error instanceof RetryableAiProviderError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new AppError('AI extraction request timed out', 504);
    }

    throw new AppError('AI extraction request failed', 502);
  } finally {
    clearTimeout(timeout);
  }
};

const requestWithRetries = async (file, prompt, configuration, model) => {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await requestGemini(file, prompt, configuration, model);
    } catch (error) {
      if (!(error instanceof RetryableAiProviderError)) {
        throw error;
      }

      if (attempt === RETRY_DELAYS_MS.length) {
        throw error;
      }

      await wait(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw new AppError(AI_BUSY_MESSAGE, 503);
};

const requestWithFallback = async (file, prompt) => {
  const configuration = getConfiguration();

  try {
    return await requestWithRetries(file, prompt, configuration, configuration.model);
  } catch (error) {
    if (!(error instanceof RetryableAiProviderError)) {
      throw error;
    }

    if (!configuration.fallbackModel || configuration.fallbackModel === configuration.model) {
      throw new AppError(AI_BUSY_MESSAGE, 503);
    }

    try {
      return await requestWithRetries(
        file,
        prompt,
        configuration,
        configuration.fallbackModel,
      );
    } catch (fallbackError) {
      if (fallbackError instanceof RetryableAiProviderError) {
        throw new AppError(AI_BUSY_MESSAGE, 503);
      }

      throw fallbackError;
    }
  }
};

const parseAndValidate = (text) => aiExtractionSchema.parse(JSON.parse(text.trim()));

export const extractDocumentData = async (file) => {
  const firstResponse = await requestWithFallback(file, extractionPrompt);

  try {
    return parseAndValidate(firstResponse);
  } catch {
    const retryResponse = await requestWithFallback(file, retryPrompt);

    try {
      return parseAndValidate(retryResponse);
    } catch {
      throw new AppError('AI service returned invalid extraction JSON', 502);
    }
  }
};
