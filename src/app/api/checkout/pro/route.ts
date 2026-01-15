/**
 * Pro Checkout API Route
 *
 * POST /api/checkout/pro
 *
 * Creates a Stripe Checkout session for the $19 one-time Pro purchase.
 * Returns the checkout URL for redirect.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createCustomer,
  getCustomerByEmail,
  createCheckoutSession,
} from '@/lib/payments';

// Pro tier price ID - set in Stripe Dashboard
// For MVP, we'll use a hardcoded price or create one dynamically
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if user already has Pro
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.is_pro) {
      return NextResponse.json(
        { error: 'You already have Pro access' },
        { status: 400 }
      );
    }

    // 3. Get or create Stripe customer
    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      // Check if customer exists by email
      const existingCustomer = await getCustomerByEmail(user.email ?? '');

      if (existingCustomer.ok && existingCustomer.value) {
        stripeCustomerId = existingCustomer.value.stripeCustomerId;
      } else {
        // Create new customer
        const customerResult = await createCustomer({
          userId: user.id,
          email: user.email ?? '',
          name: user.user_metadata?.full_name,
        });

        if (!customerResult.ok) {
          console.error('Failed to create customer:', customerResult.error);
          return NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
          );
        }

        stripeCustomerId = customerResult.value.stripeCustomerId;
      }

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    // 4. Get origin for redirect URLs
    const origin = request.headers.get('origin') ?? 'https://mytrimmy.vercel.app';

    // 5. Create checkout session
    if (!PRO_PRICE_ID) {
      // For MVP without a pre-configured price, return instructions
      return NextResponse.json(
        {
          error: 'Stripe Pro price not configured',
          setup: 'Create a $19 one-time price in Stripe Dashboard and set STRIPE_PRO_PRICE_ID'
        },
        { status: 500 }
      );
    }

    const sessionResult = await createCheckoutSession({
      customerId: user.id,
      stripeCustomerId,
      priceId: PRO_PRICE_ID,
      mode: 'payment',
      successUrl: `${origin}/dashboard?checkout=success`,
      cancelUrl: `${origin}/dashboard?checkout=canceled`,
      metadata: {
        productType: 'pro',
      },
    });

    if (!sessionResult.ok) {
      console.error('Failed to create checkout session:', sessionResult.error);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    // 6. Return checkout URL
    return NextResponse.json({
      url: sessionResult.value.url,
      sessionId: sessionResult.value.stripeSessionId,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}
