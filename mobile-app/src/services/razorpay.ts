export type CheckoutResult = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };

export async function openCheckout(_options: Record<string, unknown>): Promise<CheckoutResult> {
  throw new Error('Razorpay checkout is not available on this platform.');
}
