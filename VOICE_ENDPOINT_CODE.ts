// ======================================================================
// VOICE TRANSCRIPTION ENDPOINT - Add this to src/routes/nutrition.ts
// Add this code AFTER the barcode-lookup endpoint and BEFORE the closing of the file
// ======================================================================

/* ======================================================================
   AI: transcribe-voice (Voice to Text using OpenAI Whisper)
   ✅ Accepts audio file uploads via multer
   ✅ Returns transcribed text for meal logging
   ====================================================================== */
nutritionRouter.post("/ai/transcribe-voice", upload.single('audio'), async (req: Request, res: Response) => {
  const reqId = uuidv4();
  const t0 = nowMs();

  try {
    const cid = getShopifyCustomerId(req);
    if (!cid) {
      return res.status(400).json({ ok: false, error: "Missing shopifyCustomerId" });
    }

    const file = req.file;
    if (!file?.buffer) {
      return res.status(400).json({
        ok: false,
        error: "Missing audio upload (send multipart with field name 'audio')",
      });
    }

    console.log(`[Voice Transcription] Request from ${cid}, file size: ${file.size} bytes, mimetype: ${file.mimetype}`);

    // Determine file extension from mimetype
    const mimeToExt: Record<string, string> = {
      'audio/m4a': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac',
    };
    const ext = mimeToExt[file.mimetype || ''] || 'm4a';
    const filename = `audio.${ext}`;

    // Create File object for OpenAI API
    const audioFile = new File([file.buffer], filename, { type: file.mimetype || 'audio/m4a' });

    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    const ms = nowMs() - t0;
    console.log('[Voice Transcription] Result:', { reqId, ms, cid, text: transcription.text });

    return res.json({
      ok: true,
      text: transcription.text,
    });
  } catch (err: any) {
    console.error("[nutrition][transcribe-voice] error", { reqId, msg: errMessage(err) });
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ======================================================================
// END OF VOICE TRANSCRIPTION ENDPOINT
// ======================================================================
