import type { CheckoutResult } from './razorpay';

export async function openCheckout(options: Record<string, unknown>): Promise<CheckoutResult> {
  const web = window as any;
  if (!web.Razorpay) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not load Razorpay Checkout.'));
      document.body.appendChild(script);
    });
  }
  return new Promise((resolve, reject) => {
    const checkout = new web.Razorpay({
      ...options,
      key: options.key_id,
      handler: resolve,
      modal: { ondismiss: () => reject(new Error('Payment was dismissed.')) },
    });
    checkout.open();
  });
}
