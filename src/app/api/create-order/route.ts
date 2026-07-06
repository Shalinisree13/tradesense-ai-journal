import { NextResponse } from "next/server";

const PLAN_PRICES: Record<string, { monthly: number; yearly: number; name: string }> = {
  basic:   { monthly: 29900,  yearly: 298800,  name: "TradeSense Basic"   },
  pro:     { monthly: 79900,  yearly: 718800,  name: "TradeSense Pro"     },
  premium: { monthly: 199900, yearly: 1798800, name: "TradeSense Premium" },
};

export async function POST(request: Request) {
  try {
    // Lazy-load Razorpay inside the handler so it never runs at build time
    const Razorpay = (await import("razorpay")).default;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Payment gateway not configured. Please contact support." },
        { status: 503 }
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const { plan, billing, userId, userEmail } = await request.json();

    if (!plan || !billing || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const planInfo = PLAN_PRICES[plan];
    if (!planInfo) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const amount = billing === "yearly" ? planInfo.yearly : planInfo.monthly;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${userId}_${plan}_${Date.now()}`,
      notes: { userId, userEmail: userEmail || "", plan, billing },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: planInfo.name,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
