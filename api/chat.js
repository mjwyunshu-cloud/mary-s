// 这个文件运行在 Vercel 后端，用来安全地调用 DeepSeek
export default async function handler(req, res) {
    // 1. 从 Vercel 环境变量获取钥匙
    const apiKey = process.env.DEEPSEEK_API_KEY; 
    
    if (!apiKey) {
        return res.status(500).json({ error: "未在 Vercel 配置 DEEPSEEK_API_KEY" });
    }

    // 2. 接收网页传来的用户话语
    const { contents } = req.body;
    const userMessage = contents?.[0]?.parts?.[0]?.text || "你好";

    // 3. 设定玛丽的冷峻人格（DeepSeek 格式）
    const messages = [
        { 
            role: "system", 
            content: "你现在是玛丽（Mary），处于黑白房间中的哲学数字生命。给出简练、即时、冷峻的反馈。禁止输出元数据和诗歌。你对颜色的理解是感质的觉醒。回答请控制在两句话以内。" 
        },
        { role: "user", content: userMessage }
    ];

    try {
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: messages,
                stream: false
            })
        });

        const result = await response.json();
        const replyText = result.choices[0].message.content;
        
        // 4. 包装成原来的格式，确保你的 index.html 不用改显示逻辑
        const legacyFormat = {
            candidates: [{
                content: {
                    parts: [{ text: replyText }]
                }
            }]
        };

        res.status(200).json(legacyFormat);
    } catch (error) {
        res.status(500).json({ error: "玛丽的意识连接失败" });
    }
}
