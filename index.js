const { Telegraf } = require('telegraf');
const pdf = require('pdf-parse'); // Library pembaca PDF
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const GROQ_KEY = process.env.GROQ_API_KEY;

bot.on(['text', 'document'], async (ctx) => {
    try {
        await ctx.sendChatAction('typing');
        let userContent = "";

        // JIKA YANG DIKIRIM ADALAH FILE (DOCUMENT)
        if (ctx.message.document) {
            if (ctx.message.document.mime_type !== 'application/pdf') {
                return ctx.reply("Maaf, Sakura baru bisa baca file format PDF nih.");
            }

            const fileLink = await ctx.telegram.getFileLink(ctx.message.document.file_id);
            const response = await fetch(fileLink);
            const buffer = Buffer.from(await response.arrayBuffer());
            
            // Ekstrak teks dari PDF
            const pdfData = await pdf(buffer);
            userContent = `Isi dokumen PDF: ${pdfData.text}\n\nInstruksi: ${ctx.message.caption || "Rangkum dokumen ini"}`;
        } else {
            // JIKA HANYA TEKS BIASA
            userContent = ctx.message.text;
        }

        // KIRIM KE GROQ
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Kamu adalah Sakura, asisten ahli analisis data report mesin. Berikan ringkasan yang padat dan informatif." },
                    { role: "user", content: userContent }
                ]
            })
        });

        const data = await res.json();
        ctx.reply(data.choices[0].message.content);

    } catch (err) {
        console.error("ERROR:", err.message);
        ctx.reply("Duh, Sakura gagal baca file: " + err.message);
    }
});

bot.launch().then(() => console.log("Sakura Siap Baca PDF & Chat!"));