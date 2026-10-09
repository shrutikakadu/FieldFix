import RazorpayCheckout from 'react-native-razorpay';
import type { CheckoutResult } from './razorpay';

export const openCheckout = (options: Record<string, unknown>): Promise<CheckoutResult> => RazorpayCheckout.open(options);
