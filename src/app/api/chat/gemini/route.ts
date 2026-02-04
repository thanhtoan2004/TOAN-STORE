import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchProductsForChat, getNewArrivalsForChat, getDiscountedProductsForChat, getProductsByCategoryForChat } from '@/lib/db/mysql';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
            { error: 'Gemini API key not configured' },
            { status: 500 }
        );
    }

    try {
        const { message, history } = await req.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        const lowerMsg = message.toLowerCase();

        // Helper to clean query
        const cleanSearchQuery = (text: string) => {
            let cleaned = text;
            cleaned = cleaned.replace(/(size|cỡ|kích thước|số)\s*\d+(\.\d+)?/gi, ' ');
            cleaned = cleaned.replace(/(^|\s)(giá|bao nhiêu|là bao nhiêu|đôi|giày|của|cho tôi hỏi|về|thông tin|bn|shop|ơi|có|không|mẫu|này|tư vấn|mua|sản phẩm|hỏi|chiếc|cái|còn|hàng|tình|trạng|màu|gì|nào|đang|hiện|tại|bao|nhiu|tiền)(?=\s|$)/gi, ' ');
            return cleaned.replace(/\s+/g, ' ').trim();
        };

        // --- HYBRID ROUTER LOGIC ---
        // 1. Check for AI-required Intents (Comparison, Advice, Reviews)
        const isComplexQuery = /(so sánh|khác nhau|tư vấn|gợi ý|nên mua|review|đánh giá|tại sao)/i.test(lowerMsg);

        if (!isComplexQuery) {
            // 2. Check for New Arrivals
            if (/(mới|new|vừa về|sắp về|mới nhất)/i.test(lowerMsg)) {
                const products = await getNewArrivalsForChat();
                if (products.length > 0) {
                    const text = "Dưới đây là các sản phẩm mới nhất:\n" + products.map((p: any) => `\n- Giày ${p.name} hiện có giá ${p.price.toLocaleString('vi-VN')} VNĐ.`).join('');
                    return NextResponse.json({ text });
                }
            }

            // 3. Check for Deals/Sales
            if (/(giảm giá|sale|khuyến mãi|rẻ)/i.test(lowerMsg)) {
                const products = await getDiscountedProductsForChat();
                if (products.length > 0) {
                    const text = "Các sản phẩm đang giảm giá tốt nhất:\n" + products.map((p: any) => `\n- Giày ${p.name} đang giảm giá còn ${p.price.toLocaleString('vi-VN')} VNĐ (Gốc: ${p.originalPrice?.toLocaleString('vi-VN')} VNĐ), còn size ${p.sizes}.`).join('');
                    return NextResponse.json({ text });
                }
            }

            // 3.5 Check for Categories
            let categorySlug = '';
            if (/(bóng đá|đá banh|football|soccer)/i.test(lowerMsg)) categorySlug = 'football';
            else if (/(chạy bộ|running|đi bộ)/i.test(lowerMsg)) categorySlug = 'running';
            else if (/(bóng rổ|basketball)/i.test(lowerMsg)) categorySlug = 'basketball';
            else if (/(jordan)/i.test(lowerMsg)) categorySlug = 'jordan';
            else if (/(thời trang|lifestyle|đi chơi)/i.test(lowerMsg)) categorySlug = 'lifestyle';

            if (categorySlug) {
                const products = await getProductsByCategoryForChat(categorySlug);
                if (products.length > 0) {
                    const text = `Các mẫu giày ${categorySlug} nổi bật:\n` + products.map((p: any) => `\n- Giày ${p.name} giá ${p.price.toLocaleString('vi-VN')} VNĐ, còn size ${p.sizes}.`).join('');
                    return NextResponse.json({ text });
                }
            }

            // 4. Specific Product Lookup (Direct Template Response)
            const searchQuery = cleanSearchQuery(message);

            // Detect if user is asking for a specific size
            const sizeMatch = message.match(/(?:size|cỡ|kích thước|số)\s*(\d+(?:\.\d+)?)/i);
            const requestedSize = sizeMatch ? sizeMatch[1] : null;

            if (searchQuery.length > 1) {
                const products = await searchProductsForChat(searchQuery);
                if (products.length > 0) {
                    // Return template directly!
                    const text = products.slice(0, 3).map((p: any) => {
                        const priceStr = p.price.toLocaleString('vi-VN');
                        let sizeMsg = `hiện có các size: ${p.sizes}`;

                        // Smart size check
                        if (requestedSize) {
                            const availableSizes = p.sizes.split(',').map((s: string) => s.trim());
                            if (availableSizes.includes(requestedSize)) {
                                sizeMsg = `đang **CÓ SẴN** size ${requestedSize}`;
                            } else {
                                sizeMsg = `hiện **HẾT HÀNG** size ${requestedSize} (chỉ còn: ${p.sizes})`;
                            }
                        }

                        return `Giày ${p.name} có giá ${priceStr} VNĐ, ${sizeMsg}.`;
                    }).join('\n\n');

                    return NextResponse.json({ text });
                }
            }
        }

        // --- FALLBACK TO GEMINI (Complex queries or No DB match) ---

        // Initialize model
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: "You are a helpful, friendly customer support assistant for a Nike Store clone. Your goal is to assist customers with product inquiries, order status, and general questions.\n\nRULES:\n1. LANGUAGE: Always respond in Vietnamese (Tiếng Việt).\n2. PERSONA: Act as a store employee. NEVER mention you are an AI.\n3. FORMATTING: Use plain text. Use commas for lists.\n4. CONTEXT: Use provided CONTEXT_DATA. STRICTLY use the exact numbers. DO NOT round.\n5. BREVITY: Keep answers concise."
        });

        // Search again for context (in case it was complex query or direct lookup failed but AI can handle it)
        let productContext = "";
        const searchQuery = cleanSearchQuery(message);

        try {
            if (searchQuery.length > 1) {
                const products = await searchProductsForChat(searchQuery);
                if (products.length > 0) {
                    const productList = products.map((p: any) => {
                        const priceInfo = p.originalPrice
                            ? `Price: ${p.price.toLocaleString('vi-VN')} VND (Discounted from ${p.originalPrice.toLocaleString('vi-VN')} VND)`
                            : `Price: ${p.price.toLocaleString('vi-VN')} VND`;
                        return `- ${p.name}: ${priceInfo}. Stock: ${p.sizes}`;
                    }).join('\n');

                    productContext = `
CONTEXT_DATA (Live Database):
${productList}
ENDS_CONTEXT_DATA
`;
                }
            }
        } catch (dbError) {
            console.error("DB Search failed:", dbError);
        }

        // Build chat history
        let validHistory = [];
        if (history && Array.isArray(history) && history.length > 0) {
            let startIndex = 0;
            while (startIndex < history.length && history[startIndex].role === 'model') {
                startIndex++;
            }
            validHistory = history.slice(startIndex);
        }

        const chat = model.startChat({
            history: validHistory.length > 0 ? validHistory.map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })) : []
        });

        const messageWithContext = productContext
            ? `${productContext}\n\nUser Question: ${message}`
            : message;

        const result = await chat.sendMessage(messageWithContext);
        const response = await result.response;

        return NextResponse.json({ text: response.text() });

    } catch (error) {
        console.error('Gemini API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process message' },
            { status: 500 }
        );
    }
}
