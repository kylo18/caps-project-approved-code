const FALLBACK_QUOTES = [
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { quote: "Great things never come from comfort zones.", author: "Unknown" },
  { quote: "Your limit is your effort. Keep pushing!", author: "Unknown" },
  { quote: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
];

function getRandomFallback() {
  const index = Math.floor(Math.random() * FALLBACK_QUOTES.length);
  return FALLBACK_QUOTES[index];
}

export interface MotivationQuote {
  quote: string;
  author: string;
}

export async function fetchMotivationQuote(): Promise<MotivationQuote> {
  try {
    const response = await fetch('https://zenquotes.io/api/random', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      return {
        quote: item.q || item.quote || FALLBACK_QUOTES[0].quote,
        author: item.a || item.author || 'Unknown',
      };
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.warn('[MotivationQuote] API failed, using fallback:', error);
    return getRandomFallback();
  }
}