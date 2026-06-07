'use client';

import PayPalButton from '@/components/PayPalButton';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface Props {
  amount: string; // e.g. "19.99"
  disabled?: boolean;
  label?: string;
  description?: string;
  onApproved: (ids: { orderId: string; captureId?: string }) => Promise<void> | void;
}

export default function PayPalButtonsMount({ 
  amount, 
  disabled, 
  description,
  onApproved 
}: Props) {
  const { toast } = useToast();
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID as string | undefined;

  console.log('[paypal] env client id present:', !!clientId);

  useEffect(() => {
    // Log SDK readiness and configuration once per mount
    const log = () => {
      const wp: any = (window as any).paypal;
      const hasSdk = !!wp;
      const hasButtons = !!wp?.Buttons;
      const scripts = Array.from(document.querySelectorAll('script[src*="paypal.com/sdk/js"]')) as HTMLScriptElement[];
      const urls = scripts.map(s => s.src);
      console.log('[paypal] check', { hasSdk, hasButtons, urls, amount, currency: 'USD' });
      if (hasSdk && !hasButtons) {
        console.warn('[paypal] SDK loaded but Buttons missing (yet). Waiting for loader…');
      }
    };
    log();
    const t = setTimeout(log, 1500);
    return () => clearTimeout(t);
  }, [clientId, amount]);

  if (!clientId) {
    return (
      <div className="text-xs sm:text-sm text-red-600 text-center sm:text-left">
        PayPal Client ID is not configured. Please check your environment variables.
      </div>
    );
  }

  return (
    <PayPalButton
      clientId={clientId}
      currency="USD"
      amount={amount}
      description={description}
      onApprove={async ({ orderId, captureId }) => {
        try {
          await onApproved({ orderId, captureId });
        } catch (e: any) {
          toast({ 
            title: 'Payment Submission Failed', 
            description: e?.message || 'An unexpected error occurred', 
            variant: 'destructive' 
          });
        }
      }}
      onError={(m) => toast({ 
        title: 'PayPal Error', 
        description: m, 
        variant: 'destructive' 
      })}
      onCancel={() => toast({ 
        title: 'Payment Cancelled', 
        description: 'You cancelled the payment process' 
      })}
      disabled={disabled}
    />
  );
}