import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('Stripe secret key not configured');
      return;
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create a Stripe checkout session for course payment
   */
  async createPaymentIntent(
    amount: number,
    courseId: string,
    userId: string,
    courseName: string,
    customerEmail: string,
    savePaymentMethod: boolean = false,
  ) {
    try {
      const sessionData: any = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'vnd',
              product_data: {
                name: courseName,
                description: `Enrollment for course: ${courseName}`,
              },
              unit_amount: amount, // Stripe expects amount in smallest currency unit (VND doesn't have subunits)
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${this.configService.get('FRONTEND_URL')}/payment/result?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('FRONTEND_URL')}/payment/result?canceled=true`,
        customer_email: customerEmail,
        metadata: {
          courseId,
          userId,
        },
        payment_intent_data: {
          metadata: {
            courseId,
            userId,
          },
        },
      };

      if (savePaymentMethod) {
        // For saving payment methods, we need to set up a customer and future usage
        sessionData.payment_intent_data.setup_future_usage = 'off_session';
      }

      const session = await this.stripe.checkout.sessions.create(sessionData);

      return {
        sessionId: session.id,
        url: session.url,
        paymentIntentId: session.payment_intent,
      };
    } catch (error) {
      this.logger.error('Error creating Stripe payment intent:', error);
      throw error;
    }
  }

  /**
   * Verify Stripe webhook signature
   */
  verifyWebhook(signature: string, payload: Buffer): Stripe.Event {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      return event;
    } catch (error) {
      this.logger.error('Webhook verification failed:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook event
   */
  async handleWebhookEvent(event: Stripe.Event) {
    this.logger.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        return await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      
      case 'payment_intent.succeeded':
        return await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      
      case 'payment_intent.payment_failed':
        return await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      
      case 'charge.refunded':
        return await this.handleChargeRefunded(event.data.object as Stripe.Charge);
      
      case 'payment_method.attached':
        return await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
      
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
        return null;
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Checkout session completed: ${session.id}`);
    return {
      type: 'checkout.completed',
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      customerId: session.customer,
      customerEmail: session.customer_email,
      metadata: session.metadata,
      amountTotal: session.amount_total,
      currency: session.currency,
    };
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);
    return {
      type: 'payment.succeeded',
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
      customerId: paymentIntent.customer,
      paymentMethodId: paymentIntent.payment_method,
    };
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment intent failed: ${paymentIntent.id}`);
    return {
      type: 'payment.failed',
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
      errorMessage: paymentIntent.last_payment_error?.message,
    };
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    this.logger.log(`Charge refunded: ${charge.id}`);
    return {
      type: 'charge.refunded',
      chargeId: charge.id,
      paymentIntentId: charge.payment_intent,
      amount: charge.amount,
      amountRefunded: charge.amount_refunded,
      metadata: charge.metadata,
    };
  }

  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
    this.logger.log(`Payment method attached: ${paymentMethod.id}`);
    return {
      type: 'payment_method.attached',
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer,
      methodType: paymentMethod.type,
      card: paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      } : null,
    };
  }

  /**
   * Save payment method for future use
   */
  async savePaymentMethod(customerId: string, paymentMethodId: string) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return {
        id: paymentMethod.id,
        methodType: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        } : null,
      };
    } catch (error) {
      this.logger.error('Error saving payment method:', error);
      throw error;
    }
  }

  /**
   * Create or retrieve Stripe customer
   */
  async getOrCreateCustomer(email: string, userId: string, name?: string) {
    try {
      // Search for existing customer
      const customers = await this.stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return customers.data[0];
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      return customer;
    } catch (error) {
      this.logger.error('Error getting/creating customer:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async refund(paymentIntentId: string, amount?: number) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount, // If not specified, full refund
      });

      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        paymentIntentId: refund.payment_intent,
      };
    } catch (error) {
      this.logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Retrieve payment intent details
   */
  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error retrieving payment intent:', error);
      throw error;
    }
  }

  /**
   * Retrieve checkout session details
   */
  async retrieveSession(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      this.logger.error('Error retrieving session:', error);
      throw error;
    }
  }
}

