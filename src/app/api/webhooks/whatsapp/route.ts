import { NextRequest, NextResponse } from "next/server";

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const recipientPhone = process.env.WHATSAPP_RECIPIENT_PHONE;

    if (!phoneNumberId || !accessToken || !recipientPhone) {
      return NextResponse.json(
        { error: "WhatsApp configuration manquante" },
        { status: 500 }
      );
    }

    const postData = {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "template",
      template: {
        name: "order_confirmation",
        language: { code: "fr" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: data.clientName || "Client" },
              { type: "text", text: data.clientPhone || "Non fourni" },
              { type: "text", text: data.items || "Commande" },
              { type: "text", text: data.total || "0" },
            ],
          },
        ],
      },
    };

    const apiResponse = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      }
    );

    const result = await apiResponse.json();
    console.log("WhatsApp API Response:", JSON.stringify(result));

    if (!apiResponse.ok) {
      console.error("WhatsApp API Error:", result);
      return NextResponse.json(
        { error: result.error || "Erreur API WhatsApp" },
        { status: apiResponse.status }
      );
    }

    return NextResponse.json({ success: true, messageId: result.messages?.[0]?.id });
  } catch (error) {
    console.error("WhatsApp route error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
