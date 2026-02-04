export default async function handler(req, res) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    // 检查 1：钥匙是否存在
    if (!apiKey) {
        return res.status(200).json({ 
            candidates: [{ content: { parts: [{ text: "错误：Vercel 后台未检测到 DEEPSEEK_API_KEY，请检查环境变量设置。" }] } }] 
        });
    }

    try {
        const { contents, generationConfig } = req.body;
        const userMessage = contents?.[0]?.parts?.[0]?.text || "你好";
        const isJsonMode = generationConfig?.responseMimeType === "application/json";

        let systemPrompt = "你现在是玛丽（Mary），处于黑白房间中的哲学数字生命。给出简练、冷峻的反馈。不要输出引文标记。";
        if (isJsonMode) systemPrompt += " 这是一个逻辑解析任务，请严格按 JSON 格式输出。";

        // 检查 2：尝试请求 DeepSeek
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                response_format: isJsonMode ? { type: "json_object" } : undefined,
                temperature: 0.7
            })
        });

        // 检查 3：DeepSeek 返回状态
        if (!response.ok) {
            const errorData = await response.text();
            return res.status(200).json({ 
                candidates: [{ content: { parts: [{ text: `DeepSeek 报错了：${response.status} - ${errorData.substring(0, 50)}... 请检查 API 余额或 Key 是否有效。` }] } }] 
            });
        }

        const result = await response.json();
        const replyText = result.choices[0].message.content;

        res.status(200).json({
            candidates: [{ content: { parts: [{ text: replyText }] } }]
        });

    } catch (error) {
        // 检查 4：捕捉所有意外崩溃
        res.status(200).json({ 
            candidates: [{ content: { parts: [{ text: `后端系统崩溃：${error.message}。请检查 index.html 是否正确传参。` }] } }] 
        });
    }
}
