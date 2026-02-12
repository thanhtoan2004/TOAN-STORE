/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchProductsForChat, getNewArrivalsForChat, getDiscountedProductsForChat, getProductsByCategoryForChat, getOrderStatusForChat } from '@/lib/db/mysql';
import { formatCurrency } from '@/lib/date-utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define tools (Function Calling)
const tools = [
    {
        functionDeclarations: [
            {
                name: 'search_products',
                description: 'Tìm kiếm sản phẩm theo tên hoặc từ khóa.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        keyword: { type: 'STRING', description: 'Từ khóa tìm kiếm (ví dụ: Pegasus, Jordan)' }
                    },
                    required: ['keyword']
                }
            },
            {
                name: 'get_new_arrivals',
                description: 'Lấy danh sách các sản phẩm mới nhất vừa về cửa hàng.',
            },
            {
                name: 'get_sale_products',
                description: 'Lấy danh sách các sản phẩm đang được giảm giá hoặc khuyến mãi.',
            },
            {
                name: 'get_products_by_category',
                description: 'Lấy sản phẩm theo danh mục thể thao hoặc dòng sản phẩm.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        category: { type: 'STRING', description: 'Danh mục (ví dụ: running, football, basketball, lifestyle, jordan)' }
                    },
                    required: ['category']
                }
            },
            {
                name: 'get_order_status',
                description: 'Tra cứu trạng thái và thông tin chi tiết của một đơn hàng theo mã đơn hàng.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        orderNumber: { type: 'STRING', description: 'Mã đơn hàng (ví dụ: NIKE123456)' }
                    },
                    required: ['orderNumber']
                }
            }
        ]
    }
];

export async function POST(req: NextRequest) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    try {
        let body;
        try {
            const textBody = await req.text();
            if (!textBody) return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
            body = JSON.parse(textBody);
        } catch (jsonErr) {
            console.error('Invalid JSON:', jsonErr);
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const { message, history } = body;
        if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

        // Rotational models to avoid regional/quota availability 404s or 429s (Rate limits)
        const modelNames = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-pro", "gemini-pro-latest"];
        let response;
        let finalModelName = "";

        for (const modelName of modelNames) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    tools: tools as any,
                    systemInstruction: "Bạn là trợ lý ảo chuyên nghiệp của Nike Store (Việt Nam). Hãy hỗ trợ khách hàng tìm kiếm sản phẩm, xem hàng mới, hàng giảm giá và tra cứu đơn hàng một cách thân thiện.\n\nQUY TẮC:\n1. NGÔN NGỮ: Luôn trả lời bằng Tiếng Việt.\n2. PHONG CÁCH: Trò chuyện như nhân viên cửa hàng, không nhắc mình là AI.\n3. DỮ LIỆU: Sử dụng các công cụ (tools) được cung cấp để lấy dữ liệu thực tế. KHÔNG tự bịa ra thông tin sản phẩm.\n4. ĐƠN HÀNG: Khi khách hỏi về trạng thái đơn hàng, hãy dùng tool get_order_status."
                });

                const validHistory = history?.map((msg: any) => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                })) || [];

                const chat = model.startChat({ history: validHistory });
                const result = await chat.sendMessage(message);
                response = await result.response;
                finalModelName = modelName;
                break;
            } catch (err: any) {
                console.error(`Gemini model ${modelName} failed:`, err.status, err.message);

                // If this is the last model and it failed, return a friendly error
                if (modelName === modelNames[modelNames.length - 1]) {
                    return NextResponse.json({
                        text: "Xin lỗi, hiện tại dịch vụ AI đang quá tải (vượt quá hạn mức yêu cầu). Vui lòng thử lại sau giây lát hoặc tra cứu trực tiếp trên trang web."
                    });
                }

                // Continue to next model for 404 (Not Found) or 429 (Rate Limit/Quota)
                if (err.status === 404 || err.status === 429 || err.message.includes('404') || err.message.includes('429')) {
                    continue;
                }
                throw err;
            }
        }

        if (!response) return NextResponse.json({ error: 'No response' }, { status: 500 });

        const calls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);

        if (calls && calls.length > 0) {
            const model = genAI.getGenerativeModel({
                model: finalModelName,
                tools: tools as any,
                systemInstruction: "Bạn là trợ lý ảo chuyên nghiệp của Nike Store (Việt Nam)."
            });

            const validHistory = history?.map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })) || [];

            const chat = model.startChat({ history: validHistory });
            await chat.sendMessage(message);

            const toolResults: any = [];
            for (const call of calls) {
                const { name, args }: any = call.functionCall;
                let data: any = null;
                try {
                    if (name === 'search_products') data = await searchProductsForChat(args.keyword);
                    else if (name === 'get_new_arrivals') data = await getNewArrivalsForChat();
                    else if (name === 'get_sale_products') data = await getDiscountedProductsForChat();
                    else if (name === 'get_products_by_category') data = await getProductsByCategoryForChat(args.category);
                    else if (name === 'get_order_status') data = await getOrderStatusForChat(args.orderNumber);
                } catch (dbErr) { console.error(`Tool ${name} execution failed:`, dbErr); }

                toolResults.push({ functionResponse: { name, response: { content: data } } });
            }

            const toolResultSend = await chat.sendMessage(toolResults);
            const finalResponse = await toolResultSend.response;
            const lastCallData = toolResults[0].functionResponse.response.content;
            const lastCallName = toolResults[0].functionResponse.name;

            return NextResponse.json({
                text: finalResponse.text(),
                data: lastCallData,
                dataType: lastCallName === 'get_order_status' ? 'order' : 'products'
            });
        }

        return NextResponse.json({ text: response.text() });
    } catch (error) {
        console.error('Critical Gemini Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
