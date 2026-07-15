import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const ACCESS_MODE: "public" = "public";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB — checked BEFORE compression
const ALLOWED_TYPES = ["application/pdf", "image/jpeg"];
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg"];

function hasAllowedExtension(filename: string) {
  const lower = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const typeOk = ALLOWED_TYPES.includes(file.type);
  const extOk = hasAllowedExtension(file.name);

  if (!typeOk || !extOk) {
    return NextResponse.json(
      { error: "Only PDF, JPG, or JPEG files are allowed" },
      { status: 415 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File exceeds 10 MB limit" },
      { status: 413 }
    );
  }

  try {
    let buffer = Buffer.from(await file.arrayBuffer());
    let contentType = file.type;
    let filename = file.name;

    if (file.type === "image/jpeg") {
      // Real compression: resize if oversized + re-encode at lower quality.
      buffer = await sharp(buffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .jpeg({ quality: 70, mozjpeg: true })
        .toBuffer();
    }
    // PDFs are stored as-is. True PDF compression needs Ghostscript-class
    // tooling that doesn't run practically in a serverless function —
    // not implemented here rather than faked.

    const key = `email-attachments/${Date.now()}-${filename}`;

    const blob = await put(key, buffer, {
      access: ACCESS_MODE,
      contentType,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    });
  } catch (err) {
    console.error("Blob upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}